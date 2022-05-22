import { Injectable, Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import _path from 'path';
import FileType from 'file-type';
import fs from 'fs-extra';
import { TencentAiService } from './tencent.ai';
import { QiniuService } from './qiniu.service';
import { ToolsService } from './tools.service';
import glob from 'glob';
var urlencode = require('urlencode');
// 小程序大文件上传类
@Injectable()
export class MiniprogramUploadService {
  public logger: any;
  UPLOAD_DIR: any;
  TEMP_DIR: any;
  PCM_DIR: any;
  MP3_DIR: any;
  COVER_DIR: any;
  constructor(
    private readonly tencentAi: TencentAiService,
    private readonly qiniuUpload: QiniuService,
    private readonly toolsService: ToolsService

  ) {
    this.logger = new Logger('MiniprogramUploadService');
    // 文件存放路径
    this.UPLOAD_DIR = _path.join(__dirname, '../public/upload/')
    // 文件临时存放路径
    this.TEMP_DIR = _path.resolve(__dirname, '../public/tmp/')
    // PCM文件临时存放路径
    this.PCM_DIR = _path.resolve(__dirname, '../public/pcm/')
    // MP3文件临时存放路径
    this.MP3_DIR = _path.resolve(__dirname, '../public/mp3/')
    // 视频封面临时存放路径
    this.COVER_DIR = _path.resolve(__dirname, '../public/cover/');
    fs.ensureDirSync(this.UPLOAD_DIR);
    fs.ensureDirSync(this.TEMP_DIR);
    fs.ensureDirSync(this.PCM_DIR);
    fs.ensureDirSync(this.MP3_DIR);
    fs.ensureDirSync(this.COVER_DIR);
  }
  public mergeFiles(chunkFilePaths: any[], writeStream: any) {
    return new Promise<void>((resolve) => {
      const pipeStream = () => {
        if (!chunkFilePaths.length) {
          writeStream.end('done');
          resolve();
          return;
        }
        const filePath = chunkFilePaths.shift();
        const readSteam = fs.createReadStream(filePath);
        readSteam.pipe(writeStream, { end: false });
        readSteam.on('end', function () {
          fs.removeSync(filePath);
          pipeStream();
        });
      };
      pipeStream();
    });
  }
  // 上传
  async upload(query: any, rawBody: any) {
    const { identifier, index } = query;
    const chunkDir = _path.resolve(this.TEMP_DIR, identifier);
    fs.ensureDirSync(chunkDir)
    fs.writeFileSync(`${chunkDir}/${identifier}-${index}`, rawBody);
    return {
      tempFilePath: `${identifier}-${index}`,
    };
  }

  isNull(data: any) {
    return (data === "" || data === undefined || data === null || data === 'undefined');
  }
  // 合并
  async merge(query: any, userInfo: any) {
    const audioArr = ['wav', 'ogg-opus', 'speex', 'silk', 'm4a', 'aac'];
    const { identifier, size, duration, name, width, height, fileName } = query;
    const chunkDir = _path.resolve(this.TEMP_DIR, identifier);
    const chunkFiles = fs.readdirSync(chunkDir);
    chunkFiles.sort((a: any, b: any) => a.split('-')[1] - b.split('-')[1]);
    const chunkFilePaths = chunkFiles.map((_fileName) =>
      _path.resolve(chunkDir, _fileName),
    );
    const targetFilePath = _path.resolve(this.UPLOAD_DIR, identifier);
    const writeStream = fs.createWriteStream(targetFilePath);
    await this.mergeFiles(chunkFilePaths, writeStream);
    // 文件名可能为空
    let ext = '';
    if (fileName !== 'undefined' && fileName) {
      ext = fileName.replace(/.+\./, "");
    } else {
      const fileExt = await FileType.fromFile(targetFilePath);
      ext = fileExt.ext;
    }
    console.log(ext);
    fs.renameSync(targetFilePath, `${targetFilePath}.${ext}`);
    fs.removeSync(chunkDir);
    var _resformat = null;
    var _ffprobe =
      'ffprobe -i ' +
      `${targetFilePath}.${ext}` +
      ' -print_format json -show_streams -show_format -v 0';
    if (!duration) {
      var format = await this.toolsService.ShellExecCmd(_ffprobe, '获取音频流');
      _resformat = JSON.parse(format['data'])
    }
    var _duration = Math.ceil(parseFloat(duration ? duration : _resformat.format.duration))
    var optionsAudio = {
      _id: '',
      type: ext === 'mp4' ? 1 : 2,
      metaInfo: {
        fileName:
          this.isNull(fileName) ? dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss') + '.' + ext : decodeURIComponent(fileName),
        cover: '',
        width: '',
        height: '',
        duration: _duration,  // 如果有时长传过来就入库，没有就读流格式
        size: size,
      },
      taskId: 0,
      audioSrc: '',
      tempAudio: identifier,  // 记录音频文件名
      ext: ext,
      taskDetailed: [],
      taskText: '',
      taskStatus: 1,
    }
    if (width) {
      optionsAudio['width'] = width
    }
    if (height) {
      optionsAudio['height'] = height
    }
    // 上传时时长不够处理的处理同样保存
    if (userInfo.remaining_time < _duration) {
      optionsAudio.taskStatus = 2; // 转换失败
      return {
        code: 2, // 时长不足
        data: optionsAudio,
        isUserTimeSub: false
      }
    }
    return {
      code: 1, // 成功
      data: optionsAudio,
      isUserTimeSub: true
    }
  }
  // 处理音频转换和封面图
  async AudioTask(data: any) {
    const targetFilePath = _path.resolve(this.UPLOAD_DIR, data.tempAudio);
    const pcmFilePath = _path.resolve(this.PCM_DIR, data.tempAudio);
    const mp3FilePath = _path.resolve(this.MP3_DIR, data.tempAudio);
    var _cover_result = null;

    var result = null;
    var _ffmpeg =
      'ffmpeg  -i ' +
      `${targetFilePath}.${data.ext}` +
      ' -vn -f s16le -ac 1 -ar 16000 -acodec pcm_s16le ' +
      pcmFilePath +
      '.pcm';
    // 提取音频转为pcm
    var _res = await this.toolsService.ShellExecCmd(_ffmpeg, '音频转PCM');
    var _ffmpegToMp3 =
      'ffmpeg -y -ac 1 -ar 16000 -f s16le -i ' +
      pcmFilePath +
      '.pcm' +
      ' -c:a libmp3lame -q:a 2 ' +
      mp3FilePath +
      '.mp3';
    // 音频是没有封面图
    if (data.ext === 'mp4') {
      var _cover_img = this.COVER_DIR + '/' + data.tempAudio + '.jpg';
      // 截图第一帧为封面图
      var _coverImage =
        'ffmpeg -i ' +
        `${targetFilePath}.${data.ext}` +
        ' -y -f image2 -frames 1 ' +
        _cover_img;
    }
    var _ffprobe =
      'ffprobe -i ' +
      `${targetFilePath}.${data.ext}` +
      ' -print_format json -show_streams -show_format -v 0';
    if (_res['success']) {
      // 如果传过的是MP3
      if (data.ext === 'mp3') {
        fs.moveSync(`${targetFilePath}.${data.ext}`, `${mp3FilePath}.${data.ext}`)
        result = await this.qiniuPrameter(mp3FilePath, data.tempAudio);
        result = { url: '' }
      } else {
        var _resMp3 = await this.toolsService.ShellExecCmd(_ffmpegToMp3, 'PCM转MP3');
        if (_resMp3['success']) {
          // 将音频提交到七牛云
          result = await this.qiniuPrameter(mp3FilePath, data.tempAudio);
        }
      }
      if (data.ext === 'mp4') {
        // 生成封面
        await this.toolsService.ShellExecCmd(_coverImage, '视频提取封面');
        // 将封面提交到七牛云
        _cover_result = await this.qiniuUpload.qiniuPrameter(
          _cover_img,
          'upload',
          data.tempAudio + '.jpg',
        );
        if (!_cover_result) {
          return {
            code: 1, // 上传封面到七牛云出错
            data: null,
            msg: '上传封面到七牛云出错'
          }
        } else {
          fs.removeSync(_cover_img);
        }
      }
      return {
        code: 0,
        data: {
          audioSrc: result.url,
          cover: _cover_result && _cover_result.url
        },
        msg: '生成成功'
      }
    }
  }
  // 腾讯语音转写任务
  async tencentAicreateTask(data: any) {
    var optionsAudio = {
      code: 0,
      data: {
        taskId: '',
        taskText: '',
        taskDetailed: [],
        taskStatus: 1,
        tempAudio: '',
      },
      msg: '转写成功'
    }
    var _task_tenncent = await this.tencentAi.createTask(
      {
        audioUrl: data.pcmFilePath,
        mp3Url: data.audioSrc
      }, data.duration, 'pcm');
    if (!_task_tenncent.code) {
      // 有TaskId代表用的是录音文件转写
      if (_task_tenncent.flash_result.TaskId) {
        optionsAudio.data.taskId = _task_tenncent.flash_result.TaskId;
      } else {
        // 录音极速版
        optionsAudio.data.taskDetailed = _task_tenncent.flash_result.sentence_list;
        optionsAudio.data.taskText = _task_tenncent.flash_result.text;
        optionsAudio.data.taskStatus = 3;
      }
      // 成功就清空
      optionsAudio.data.tempAudio = '';
      return optionsAudio
    } else {
      return {
        code: _task_tenncent.code,
        data: null,
        msg: _task_tenncent.msg
      };
    }
  }
  // 上传七牛云
  async qiniuPrameter(mp3FilePath: any, identifier: any) {

    var result = await this.qiniuUpload.qiniuPrameter(
      mp3FilePath + '.mp3',
      'mp3',
      identifier + '.mp3',
    );
    if (!result || !result['url']) {
      return {
        code: 3
      }
    }
    return result
  }
  // 秒传验证
  verify(query: any) {
    const { identifier } = query;
    console.log(`identifier ${identifier}, verify`);
    const matchs = glob.sync(`${identifier}.*`, { cwd: this.UPLOAD_DIR });
    if (matchs.length) {
      return JSON.stringify({
        needUpload: false,
        url: _path.resolve(this.UPLOAD_DIR, matchs[0]),
      });
    } else {
      const chunkDir = _path.resolve(this.TEMP_DIR, identifier);
      const chunkFiles = fs.readdirSync(chunkDir);
      return JSON.stringify({
        needUpload: true,
        uploadedChunks: chunkFiles.map(
          (_fileName) => {
            var _file: any = _fileName.split('-');
            return _file[1] * 1
          }),
      });
    }
  }
}