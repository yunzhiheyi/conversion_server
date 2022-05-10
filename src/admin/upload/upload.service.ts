import { Injectable, Logger } from '@nestjs/common';
const Busboy = require('busboy');
import fs from 'fs-extra';
import _path from 'path';
import { SystemService } from 'src/admin/system/system.service';
import { QiniuService } from '../../utils/qiniu.service';
import { UploadModel } from '../../models/admin/upload.model';
import { ReturnModelType } from '@typegoose/typegoose';
import { InjectModel } from 'nestjs-typegoose';
import { SnowflakeService } from '@quickts/nestjs-snowflake';
import dayjs from 'dayjs';
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
    this.serverPath = _path.join(__dirname, '../../public/upload/');
  }
  // 本地上传方法
  localUpload(req: { headers: any; pipe: (arg0: any) => void; }, options: { path: any; type?: any; }) {
    return new Promise((resolve, reject) => {
      let upload = {};
      const _Busboy = new Busboy({ headers: req.headers });
      const filePath = _path.join(options.path, '');
      fs.ensureDirSync(filePath);
      _Busboy.on(
        'file',
        function (fieldname, file, filename, encoding, mimetype) {
          const fileFormat = mimetype.split('/');
          const fileName = dayjs().format('YYYY.MM.DD_HH:mm:ss:SSS') + '.' + fileFormat[1]; // 重命名上传文件
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
  // 文件上传方法
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
      // 处理文件的URL
      var url =
        _SYS.setup['upload_type'] === '1'
          ? _SYS.setup['serverUrl'] + '/upload/' + _upload['fileName']
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
            fileName: fileNames.name,
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
            fileName: fileNames.name,
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
  // 删除本地与七牛云图片 释放空间
  async deleteImage(file: any) {
    var _resOne = await this.uploadModel.findOne({ _id: file.mid });
    var res = null;
    if (!_resOne) {
      this.logger.warn('暂时找不到文件');
      return { msg: '暂时找不到文件', data: false };
    }
    // 如果有只有一张就直接删除
    if (_resOne.imgPath.length > 1) {
      res = await this.uploadModel.updateMany({ _id: file.mid }, { $pull: { "imgPath": { name: file.name } } })
    } else {
      res = await this.uploadModel.deleteMany({ _id: file.mid })
    }
    // 七牛云模式
    if (_resOne.key === 'qiniu') {
      const isDel = await this.qiniuUpload.batchDeleteFile([
        'upload/' + file.name,
      ]);
      if (isDel) {
        this.logger.log('七牛云文件删除成功')
        res = true;
      }
    }
    return res ? { msg: '删除成功', data: true } : { msg: '删除失败', data: false };
  }
  // 定时删除无用图片 释放空间
  async pollingDeleteImage() {
    var _resOne = await this.uploadModel.find({ isLock: false }, { _id: 1, imgPath: 1, key: 1 });
    // id数组
    var ids = [];
    // 图片name数组，用于删除七牛云的文件
    var qiniuFileName = [];
    // 本地图片name数组，用于删除七牛云的文件
    var localFileName = [];
    // 拼装数据
    _resOne.map((item) => {
      ids.push(item._id);
      item.imgPath.map((_data) => {
        // 有七牛云的标识
        if (item.key === 'qiniu') {
          qiniuFileName.push('upload/' + _data['name']);
        } else {
          localFileName.push('upload/' + _data['name']);
        }
      })
    })
    // 开始删除
    if (ids.length > 0) {
      // 数据库里的路径
      var isDelLocal = await this.uploadModel.deleteMany({ _id: { $in: ids } })
      if (qiniuFileName.length > 0) {
        const isDelQiniu = await this.qiniuUpload.batchDeleteFile(qiniuFileName);
        if (isDelQiniu) {
          this.logger.log('七牛云文件批量删除成功')
        }
      }
      if (isDelLocal) {
        localFileName.forEach((_res) => {
          fs.removeSync(_path.join(__dirname, '../../public/' + _res));
        })
        this.logger.log('本地文件批量删除成功')
      }
    }
  }

}