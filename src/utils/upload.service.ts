import { Injectable, Logger } from '@nestjs/common';
const Busboy = require('busboy');
import { QiniuService } from './qiniu.service';
import fs from 'fs-extra';
import _path from 'path';
import { SystemService } from 'src/admin/system/system.service';
import { UploadModel } from '../models/admin/upload.model';
import { ReturnModelType } from '@typegoose/typegoose';
import { InjectModel } from 'nestjs-typegoose';
import { SnowflakeService } from '@quickts/nestjs-snowflake';
// 上传类
@Injectable()
export class UploadService {
  public logger: Logger;
  public serverPath: string;
  constructor(
    @InjectModel(UploadModel)
    private readonly uploadModel: ReturnModelType<typeof UploadModel>,
    private readonly qiniuUpload: QiniuService,
    private readonly systemService: SystemService,
    private readonly snowflake: SnowflakeService,
  ) {
    this.logger = new Logger('UploadService');
    this.serverPath = _path.join(__dirname, '../public/uploads/');
  }
  // 本地上传
  localUpload(req, options) {
    return new Promise((resolve, reject) => {
      let upload = {};
      const _Busboy = new Busboy({ headers: req.headers });
      const filePath = _path.join(options.path, '');
      fs.ensureDirSync(filePath);
      _Busboy.on(
        'file',
        function (fieldname, file, filename, encoding, mimetype) {
          const fileFormat = filename.split('.');
          const fileName = Date.now() + '.' + fileFormat[fileFormat.length - 1]; // 重命名上传文件
          const saveTo = _path.join(_path.join(filePath, fileName));
          file.pipe(fs.createWriteStream(saveTo));
          upload['fileName'] = fileName;
        },
      );
      _Busboy.on('field', function (data: string | number, val: any) {
        upload[data] = val;
      });
      _Busboy.on('finish', function () {
        resolve(upload);
      });
      _Busboy.on('error', function () {
        this.logger.warn('上传出错');
      });
      req.pipe(_Busboy);
    });
  }
  // 上传方法
  async uploadFile(req: any) {
    var _SYS = await this.systemService.getSystemInfo(); // 获取系统参数
    var fileNames = {} as any;
    if (!_SYS) {
      return { msg: '获取不到系统参数!' };
    } else {
      // 本地图片流返回数据
      const _upload = await this.localUpload(req, {
        path: this.serverPath,
        type: _SYS.setup['upload_type'],
      });
      const imgPath = _path.join(this.serverPath, _upload['fileName']);
      // 获取系统参数配置upload_type
      if (_SYS.setup['upload_type'] === '2') {
        const result = await this.qiniuUpload.qiniuPrameter(imgPath, 'upload', _upload['fileName']);
        if (!result || !result['url']) {
          return { msg: '上传到云端时发生错误!' };
        }
        //上传到七牛云后返回结果替换_upload字段
        if (result) {
          let fileName = _path.win32.basename(imgPath);
          _upload['fileName'] = fileName;
          _upload['url'] = result['url'];
        }
      }

      // 处理图片的URL
      var url =
        _SYS.setup['upload_type'] === '1'
          ? _SYS.setup['serverUrl'] + '/uploads/' + _upload['fileName']
          : _upload['url'];
      let _files = {
        imgPath: [],
        key: _SYS.setup['upload_type'] === '1' ? 'local' : 'qiniu'
      };
      fileNames.name = _upload['fileName'] + '';
      fileNames.url = url + (_SYS.setup['upload_type'] === '2' ? (_upload['imageMogr'] || '') : '');

      // 如果图片流传过来的参数有mid就执行更新操作
      if (typeof _upload['mid'] !== 'undefined') {
        let data = await this.uploadModel.updateMany({ _id: _upload['mid'] }, { $addToSet: { imgPath: fileNames } });
        if (data) {
          return {
            mid: _upload['mid'],
            fileName: fileNames.name, //多图数组
            fileUrl: fileNames.url,
          };
        }
      } else {
        _files.imgPath.push({
          name: _upload['fileName'],
          url: fileNames.url,
        });
        _files['_id'] = await this.snowflake.nextId(); // 新建ID
        let data = await this.uploadModel.create(_files);
        if (data) {
          return {
            mid: data._id,
            fileName: fileNames.name, //多图数组
            fileUrl: fileNames.url
          }
        }
        if (_SYS.setup['upload_type'] === '2') {
          // 同步到七牛云后删除此图片
          fs.unlinkSync(imgPath);
        }
      }
    }
  }
  // 删除图片
  async deleteImage(file: any) {
    var _resOne = await this.uploadModel.findOne({ _id: file.mid });
    var res = null;
    // 本地模式
    if (_resOne.key === 'local') {
      // 如果有只有一张就直接删除
      if (_resOne.imgPath.length > 1) {
        res = await this.uploadModel.updateMany({ _id: file.mid }, { $pull: { "imgPath": { name: file.name } } })
      } else {
        res = await this.uploadModel.deleteMany({ _id: file.mid })
      }
    } else {

    }
    return res;
  }
}