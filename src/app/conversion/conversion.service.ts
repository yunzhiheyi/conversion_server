import { Injectable, Logger } from '@nestjs/common';
import { AppConversion } from '../../models/app/conversion.model';
import { AppUserModel } from '../../models/app/user.model';
import { AppRecord } from '../../models/app/record.model';
import { ReturnModelType } from '@typegoose/typegoose';
import { InjectModel } from 'nestjs-typegoose';
import { QiniuService } from '../../utils/qiniu.service'
import { SnowflakeService } from '@quickts/nestjs-snowflake';
import { ToolsService } from 'src/utils/tools.service';
import dayjs from 'dayjs';
import axios from 'axios';
import fs from 'fs-extra';
import _path from 'path';
import { TencentAiService } from '../../utils/tencent.ai';
import { MiniprogramUploadService } from 'src/utils/miniprogram.upload';
@Injectable()
export class ConversionService {
  public logger: Logger;
  constructor(
    @InjectModel(AppConversion)
    private readonly appConversion: ReturnModelType<typeof AppConversion>,
    @InjectModel(AppRecord)
    private readonly recordModel: ReturnModelType<typeof AppRecord>,
    @InjectModel(AppUserModel)
    private readonly appUserModel: ReturnModelType<typeof AppUserModel>,
    private readonly qiniuService: QiniuService,
    private readonly toolsService: ToolsService,
    private readonly MinuploadService: MiniprogramUploadService,
    private readonly tencentAiService: TencentAiService,
    private readonly snowflakeService: SnowflakeService
  ) {
    this.logger = new Logger('ConversionService')
  }
  // 新建转写记录
  async create(body: any, userId: any, isUserTimeSub: any) {
    body._id = await this.snowflakeService.nextId();
    body.user_id = userId;
    await this.AddRecordOrTime(body.metaInfo.duration, userId, 2, 'wt4cMCPLah', isUserTimeSub);
    return await this.appConversion.create(body);
  }

  // 增加减少记录和时长
  /*
  * @duration(时长)
  * @userId(用户ID)
  * @type (1增加, 2减少)
  * @recordName (记录类型) 看记录类型表
  * @isUserTimeSub (时长不足不处理用户时长，或不)
  */
  async AddRecordOrTime(duration: any, userId: string, type: any, recordName: string, isUserTimeSub: boolean) {
    if (isUserTimeSub) {
      // 减用户的时长
      await this.appUserModel.updateMany({ _id: userId }, {
        $inc: { remaining_time: (type === 2 ? -duration : duration) }
      })
    }
    // 记录实例ID
    let _id = await this.snowflakeService.nextId();
    // 记录用户时长记录
    var res = await this.recordModel.create({
      _id,
      type,
      user_id: userId,
      recordName,
      time: duration
    })
    return !!res;
  }
  // 查询
  async query(query: any) {
    return await this.appConversion.findOne({ _id: query.id });
  }
  // 删除记录和删除七牛云记录
  async delete(query: any) {
    const details = await this.appConversion.findOne({ _id: query.id });
    // 获取缩略图
    var cover = details.metaInfo['cover'].replace(/^(.*)\/([^/]*)$/, '$2');
    // 获取音频
    var audioSrc = details.audioSrc.replace(/^(.*)\/([^/]*)$/, '$2');
    var _batchDelete = [];
    if (cover) {
      _batchDelete.push('upload/' + cover);
    }
    if (audioSrc) {
      _batchDelete.push('mp3/' + audioSrc);
    }
    const isDel = await this.qiniuService.batchDeleteFile(_batchDelete);
    if (!isDel) {
      return false;
    }
    const result = await this.appConversion.deleteMany({ _id: query.id });
    return !!result
  }
  // 查询用户的转写记录列表
  async list(query: any, user_id: string) {
    const options = {
      type: 'page',
      queryPpage: query.page,
      limt: 100,
      findField: {
        user_id,
      }
    };
    if (query.taskStatus) {
      options.findField['taskStatus'] = query.taskStatus || 3
    }
    let data = await this.toolsService.getPageList(options, this.appConversion);
    var resultArr = []
    data.result.map((item) => {
      var _item = {
        _id: item._id,
        audioSrc: item.audioSrc,
        type: item.type,
        metaInfo: item.metaInfo,
        taskStatus: item.taskStatus,
        ext: item.ext,
        taskId: item.taskId,
        createdAt: dayjs(new Date(item['createdAt'])).format('YYYY-MM-DD HH:mm:ss')
      }
      resultArr.push(_item);
    })
    return {
      pages: data.pages,
      result: resultArr,
      total: data.total
    };
  }
  // 下载视频
  public async downloadVideo(videoUrl: any, mp4FilePath: any) {
    let writeStream = fs.createWriteStream(mp4FilePath); // 创建可写流
    const resData = await axios({ url: videoUrl, responseType: 'stream' })
    // 下载视频流
    return new Promise((resolve, reject) => {
      if (resData) {
        resData.data.pipe(writeStream)
        writeStream.on('finish', async () => {
          this.logger.log('下载完成，准备处理视频...')
          resolve(true)
        })
        writeStream.on('error', () => {
          this.logger.warn('下载失败')
          reject(false)
        })
      }
    })
  }
  // 在线视频提取保存源文件
  async onlineParse(url: any) {
    let timeDir = await this.snowflakeService.nextId() + ''
    let flieMp4Name = `${timeDir}.mp4`;
    // 文件存放路径
    const UPLOAD_DIR = _path.join(__dirname, '../../public/upload/')
    const mp4FilePath = _path.resolve(UPLOAD_DIR, flieMp4Name);
    this.logger.log('正在识别视频中...')
    const { data } = await axios.post('https://api-sv.videoparse.cn/api/customparse/parse', "appid=nDc8IiUO3J55EURa&appsecret=Y9W1fssu8m9la4o1&url=" + url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8;'
      }
    });
    // 识别有误
    if (data.code > 0) {
      this.logger.warn(JSON.stringify(data))
      return {
        code: data.code,
        msg: data.msg
      }
    }
    this.logger.log('识别成功，正在下载视频...')
    // 下载视频流
    const resData = await this.downloadVideo(data.body.video_info.url, mp4FilePath)
    if (resData) {
      return { code: 200, videoUrl: flieMp4Name }
    }
  }

  // 在线视频提取
  async parse(url: any, userId: any) {
    // 获取用户信息
    var userInfo = await this.appUserModel.findOne({ _id: userId });
    let timeDir = await this.snowflakeService.nextId() + ''
    let flieMp4Name = `${timeDir}.mp4`;
    // 文件存放路径
    const UPLOAD_DIR = _path.join(__dirname, '../../public/upload/')
    const mp4FilePath = _path.resolve(UPLOAD_DIR, flieMp4Name);
    this.logger.log('正在识别视频中...')
    const { data } = await axios.post('https://api-sv.videoparse.cn/api/customparse/parse', "appid=nDc8IiUO3J55EURa&appsecret=Y9W1fssu8m9la4o1&url=" + url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8;'
      }
    });
    // 识别有误
    if (data.code > 0) {
      this.logger.warn(JSON.stringify(data))
      return {
        code: data.code,
        msg: data.msg
      }
    }
    this.logger.log('识别成功，正在下载视频...')
    // 下载视频流
    const resData = await this.downloadVideo(data.body.video_info.url, mp4FilePath)
    if (resData) {
      var streamsInfo = null;
      var createOptions = null;
      var _ffprobe =
        'ffprobe -i ' +
        `${mp4FilePath}` +
        ' -print_format json -show_streams -show_format -v 0';
      var videoStreamsInfo = await this.toolsService.ShellExecCmd(_ffprobe, '读取视频流信息');
      // 视频信息格式化
      streamsInfo = JSON.parse(videoStreamsInfo['data']);
      // 音频转换成功
      if (videoStreamsInfo['success']) {
        createOptions = {
          type: 1,
          metaInfo: {
            fileName:
              dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss') + '.mp4',
            cover: data.body.video_info.cover,
            width: streamsInfo.streams.width,
            height: streamsInfo.streams.height,
            duration: parseInt(streamsInfo.format.duration),
            size: streamsInfo.format.size,
          },
          taskId: 0,
          audioSrc: '',
          ext: 'mp4',
          taskDetailed: [],
          taskText: '',
          taskStatus: 1,
          tempAudio: timeDir,
        }
        if (userInfo.remaining_time < streamsInfo.format.duration) {
          createOptions.taskStatus = 2;// 转换失败
        }
        // 上传时时长不够处理的处理同样保存
        const _data = await this.create(createOptions, userId, userInfo.remaining_time > streamsInfo.format.duration);
        return {
          code: userInfo.remaining_time < streamsInfo.format.duration ? 2 : 0,
          _id: _data._id
        }
      }
    }
  }

  // 更新记录
  async updateManyData(id: any, options: any) {
    const _data = await this.appConversion.updateMany(id, { $set: options })
    if (_data) {
      return !!_data
    }
  }
  // 删除超过7天的转写记录文本
  async findTo7() {
    var _res = await this.appConversion.deleteMany({
      'ExpirationTime': {
        $lt: new Date(),
      }
    })
    this.logger.log('共有删除' + _res.deletedCount + '个无用记录')
  }
  // 用户的邀请数据
  async userInvitationRecord(user_id: any) {
    const userCount = await this.recordModel.aggregate([{
      $match: {
        $and: [{
          user_id,
          recordName: 'reM0k3R3Ec'
        }],
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        timeCount: { $sum: '$time' }
      },
    }
    ]);
    return userCount
  }
}
