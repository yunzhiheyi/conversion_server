import { Injectable } from '@nestjs/common';
import qiniu from 'qiniu';
import { SystemService } from '../admin/system/system.service';
// 七牛云
@Injectable()
export class QiniuService {
  bucket: any;
  bucket_url: any;
  bucketManager: qiniu.rs.BucketManager;
  constructor(
    private readonly systemService: SystemService
  ) {
    var _this = this;
    _this.systemService.getSystemInfo().then((_SYS) => {
      if (!_SYS) {
        this.systemService.mongorestore('2022.02.09_03.45.54');
      }
      qiniu.conf.ACCESS_KEY = _SYS.qiniu['access_key'];
      qiniu.conf.SECRET_KEY = _SYS.qiniu['secret_key'];
      _this.bucket = _SYS.qiniu['bucket'];
      _this.bucket_url = _SYS.qiniu['bucket_url'];
      var mac = new qiniu.auth.digest.Mac(_SYS.qiniu['access_key'], _SYS.qiniu['secret_key']);
      var config = new qiniu.conf.Config();
      config['zone'] = qiniu.zone.Zone_z2;
      _this.bucketManager = new qiniu.rs.BucketManager(mac, config);
    });
  }
  // 获取Token
  uptoken(key: string) {
    var putPolicy = new qiniu.rs.PutPolicy({ scope: this.bucket + ':' + key });
    return putPolicy.uploadToken();
  }
  // 上传文件
  async qiniuPrameter(filePaths, path, filePathName) {
    const config = new qiniu.conf.Config();
    const formUploader = new qiniu.form_up.FormUploader(config);
    // key 为上传到七牛云后自定义图片的名称
    var _key = (path || 'upload') + '/' + filePathName;
    var _token = this.uptoken(_key);
    var extra = new qiniu.form_up.PutExtra();
    return new Promise((resolve, reject) => {
      formUploader.putFile(_token, _key, filePaths, extra, (err, ret) => {
        if (!err) {
          resolve({
            url: this.bucket_url + ret.key,
          });
        } else {
          reject(err);
        }
      });
    });
  }
  // 删除空间文件
  deleteFile(key) {
    return new Promise((resolve, reject) => {
      this.bucketManager.delete(this.bucket, key, (err, respBody, respInfo) => {
        if (err) {
          reject(err);
          //throw err;
        } else {
          resolve({
            statusCode: respInfo.statusCode,
            respBody: respBody,
          });
        }
      });
    });
  }
  // 批量删除
  batchDeleteFile(keyArr) {
    var deleteOperations = keyArr.map((item) => {
      return qiniu.rs.deleteOp('yunzhiheyi', item);
    });
    return new Promise((resolve, reject) => {
      this.bucketManager.batch(deleteOperations, (err, respBody, respInfo) => {
        if (err) {
          reject(err);
        } else {
          // 200 is success, 298 is part success
          resolve({
            statusCode: respInfo.statusCode,
            respBody: respBody,
          });
        }
      });
    });
  }
}