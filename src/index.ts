import OSS from "ali-oss";
import { Packager } from "app-builder-lib";
import { Arch, log } from "builder-util";
import { HttpPublisher, PublishContext, UploadTask } from "electron-publish";
import { ClientRequest } from "http";
// import { createReadStream } from 'fs-extra-p';
import { resolve } from "path";
import posixPath from "path/posix";

interface AliOssPublishContext extends PublishContext {
  readonly packager: Packager;
}
interface AliOssUploadTask extends UploadTask {
  readonly packager: Packager;
}
interface AliOssPublisherConfig {
  bucket: string;
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  resumable: boolean;
  verbose: boolean;
  maxResume: number;
  localConfig: string;
  path: string;
}
export default class AliOssPublisher extends HttpPublisher {
  public readonly providerName = "alioss";
  protected useSafeName: boolean = true;
  private readonly client: OSS;
  protected readonly context!: AliOssPublishContext;
  protected config: AliOssPublisherConfig;

  protected constructor(
    context: AliOssPublishContext,
    publishConfig: AliOssPublisherConfig,
    useSafeArtifactName?: boolean
  ) {
    super(context);
    // const config = this.getConfig();
    this.useSafeName = useSafeArtifactName || true;
    let config = {
      ...publishConfig,
    };
    if (publishConfig.localConfig) {
      const localConfig = require(resolve(
        this.context.packager.appDir,
        config.localConfig
      ));
      config = {
        ...config,
        ...localConfig,
      };
    }
    this.config = {
      ...config,
    };
    this.config.resumable = this.config.resumable || true;
    log.debug(
      { config: JSON.stringify(this.config) },
      "ali-oss-publisher:initial"
    );
    this.client = new OSS({
      region: config.region,
      //云账号AccessKey有所有API访问权限，建议遵循阿里云安全最佳实践，部署在服务端使用RAM子账号或STS，部署在客户端使用STS。
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      bucket: config.bucket,
    });
  }

  protected doUpload(
    fileName: string,
    _arch: Arch,
    _dataLength: number,
    _requestProcessor: (
      request: ClientRequest,
      reject: (error: Error) => void
    ) => void,
    filePath: string
  ): Promise<any> {
    const config = this.config;
    let uploadName: string = fileName;
    if (config.path) {
      uploadName = posixPath.join(config.path, fileName);
    }

    return this.context.cancellationToken.createPromise(
      async (resolve, reject) => {
        const { resumable } = this.config;
        const maxResume = this.config.maxResume || 5;
        let checkpoint;
        try {
          for (let i = 0; i < (resumable ? maxResume : 1); i++) {
            // try to resume the upload
            log.info(
              { info: `${fileName}: uploading...🕑 ` },
              "ali-oss-publisher:uploads:start"
            );
            log.debug(
              {
                fileName,
                filePath,
                uploadName,
              },
              "ali-oss-publisher:uploads:details"
            );
            const result = await this.client.multipartUpload(
              uploadName,
              filePath,
              {
                progress: async (percentage, cpt) => {
                  checkpoint = cpt;
                  if (this.config.verbose && cpt) {
                    log.info(
                      {
                        info: `${uploadName}: ${
                          cpt.doneParts.length
                        }\/${Math.ceil(cpt.fileSize / cpt.partSize)}(${(
                          percentage * 100
                        ).toFixed(2)}%)`,
                      },
                      "ali-oss-publisher:uploads:progress"
                    );
                  }
                },
                checkpoint: checkpoint,
                meta: {},
              }
            );
            resolve(result);
            log.info(
              {
                result: `${uploadName}: upload success...✅ `,
              },
              "ali-oss-publisher:uploads:done"
            );
            break; // break if the upload success;
          }
        } catch (e) {
          // 捕获超时异常
          if (e.code === "ConnectionTimeoutError") {
            log.error({message: "Woops,Timeout!"}, "ali-oss-publisher:uploads:error");
            // do ConnectionTimeoutError operation
          }
          log.error({message: e.message || e}, "ali-oss-publisher:uploads:error");
        }
      }
    );
  }
  public toString() {
    return `${this.providerName}(${this.config.bucket})`;
  }
}
