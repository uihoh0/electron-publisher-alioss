import { Packager } from 'app-builder-lib';
import { HttpPublisher, PublishContext, UploadTask } from 'electron-publish';
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
    readonly providerName = "alioss";
    protected useSafeName: boolean;
    private readonly client;
    protected readonly context: AliOssPublishContext;
    protected config: AliOssPublisherConfig;
    protected constructor(context: AliOssPublishContext, publishConfig: AliOssPublisherConfig, useSafeArtifactName?: boolean);
    upload(task: AliOssUploadTask): Promise<any>;
    doUpload(fileName: any, filePath: any, arch: any, os: any): Promise<void>;
    toString(): string;
}
export {};
