import { Packager } from 'app-builder-lib';
import { HttpPublisher, PublishContext, UploadTask } from 'electron-publish';
interface INewPublishContext extends PublishContext {
    readonly packager: Packager;
}
interface INewUploadTask extends UploadTask {
    readonly packager: Packager;
}
interface IAliOssPublisherConfig {
    bucket: string;
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    resumable: boolean;
    maxResume: number;
    localConfig: string;
    path: string;
}
export default class AliOssPublisher extends HttpPublisher {
    readonly providerName = "alioss";
    protected useSafeName: boolean;
    private readonly client;
    protected readonly context: INewPublishContext;
    protected config: IAliOssPublisherConfig;
    private checkpoint;
    protected constructor(context: INewPublishContext, publishConfig: IAliOssPublisherConfig, useSafeArtifactName?: boolean);
    upload(task: INewUploadTask): Promise<any>;
    doUpload(fileName: any, filePath: any, arch: any, os: any): Promise<void>;
    toString(): string;
}
export {};
