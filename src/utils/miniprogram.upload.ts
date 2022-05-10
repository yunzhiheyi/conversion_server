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
// 文件存放路径
const UPLOAD_DIR = _path.join(__dirname, '../public/upload/')
// 文件临时存放路径
const TEMP_DIR = _path.resolve(__dirname, '../public/tmp/')
// PCM文件临时存放路径
const PCM_DIR = _path.resolve(__dirname, '../public/pcm/')
// MP3文件临时存放路径
const MP3_DIR = _path.resolve(__dirname, '../public/mp3/')
// 视频封面临时存放路径
const COVER_DIR = _path.resolve(__dirname, '../public/cover/');

// 小程序大文件上传类
@Injectable()
export class MiniprogramUploadService {
  public logger: any;
  constructor(
    private readonly tencentAi: TencentAiService,
    private readonly qiniuUpload: QiniuService,
    private readonly toolsService: ToolsService

  ) {
    this.logger = new Logger('MiniprogramUploadService');
    fs.ensureDirSync(UPLOAD_DIR);
    fs.ensureDirSync(TEMP_DIR);
    fs.ensureDirSync(PCM_DIR);
    fs.ensureDirSync(MP3_DIR);
    fs.ensureDirSync(COVER_DIR);
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
    const chunkDir = _path.resolve(TEMP_DIR, identifier);
    fs.ensureDirSync(chunkDir)
    fs.writeFileSync(`${chunkDir}/${identifier}-${index}`, rawBody);
    return {
      tempFilePath: `${identifier}-${index}`,
    };
  }

  isNull(data: any) {
    return (data === "" || data === undefined || data === null);
  }
  // 合并
  async merge(query: any, userInfo: any) {
    const { identifier, size, duration, name, width, height, fileName } = query;
    const chunkDir = _path.resolve(TEMP_DIR, identifier);
    const chunkFiles = fs.readdirSync(chunkDir);
    chunkFiles.sort((a: any, b: any) => a.split('-')[1] - b.split('-')[1]);
    const chunkFilePaths = chunkFiles.map((fileName) =>
      _path.resolve(chunkDir, fileName),
    );
    const targetFilePath = _path.resolve(UPLOAD_DIR, identifier);
    const pcmFilePath = _path.resolve(PCM_DIR, identifier);
    const mp3FilePath = _path.resolve(MP3_DIR, identifier);
    const writeStream = fs.createWriteStream(targetFilePath);
    await this.mergeFiles(chunkFilePaths, writeStream);
    const { ext } = await FileType.fromFile(targetFilePath);
    // const ext = targetFilePath.replace(/.+\./, "");
    fs.renameSync(targetFilePath, `${targetFilePath}.${ext}`);
    fs.removeSync(chunkDir);
    var _task_tenncent = null;
    var _cover_result = null;
    var _resformat = null;
    var result = null;
    var _ffmpeg =
      'ffmpeg  -i ' +
      `${targetFilePath}.${ext}` +
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
    if (ext === 'mp4') {
      var _cover_img = COVER_DIR + '/' + identifier + '.jpg';
      // 截图第一帧为封面图
      var _coverImage =
        'ffmpeg -i ' +
        `${targetFilePath}.${ext}` +
        ' -y -f image2 -frames 1 ' +
        _cover_img;
    }
    var _ffprobe =
      'ffprobe -i ' +
      `${targetFilePath}.${ext}` +
      ' -print_format json -show_streams -show_format -v 0';
    if (_res['success']) {
      if (!duration) {
        var format = await this.toolsService.ShellExecCmd(_ffprobe, '获取音频流');
        _resformat = JSON.parse(format['data'])
      }
      // 如果传过的是MP3 jm
      if (ext === 'mp3') {
        fs.moveSync(`${targetFilePath}.${ext}`, `${mp3FilePath}.${ext}`)
        result = await this.qiniuPrameter(mp3FilePath, identifier);
        // result = { url: '' }
      } else {
        var _resMp3 = await this.toolsService.ShellExecCmd(_ffmpegToMp3, 'PCM转MP3');
        if (_resMp3['success']) {
          // 将音频提交到七牛云
          result = await this.qiniuPrameter(mp3FilePath, identifier);
        }
      }
      if (ext === 'mp4') {
        // 生成封面
        await this.toolsService.ShellExecCmd(_coverImage, '视频提取封面');
        // 将封面提交到七牛云
        _cover_result = await this.qiniuUpload.qiniuPrameter(
          _cover_img,
          'upload',
          identifier + '.jpg',
        );
        if (!_cover_result) {
          return {
            code: 4 // 上传封面到七牛云出错
          }
        } else {
          fs.removeSync(_cover_img);
        }
      }
      var _duration = Math.ceil(parseFloat(duration ? duration : _resformat.format.duration))
      var optionsAudio = {
        _id: '',
        type: ext === 'mp4' ? 1 : 2,
        metaInfo: {
          fileName:
            this.isNull(name) ? dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss') + '.' + ext : decodeURIComponent(name),
          cover: ext === 'mp4' ? _cover_result['url'] : '',
          width: '',
          height: '',
          duration: _duration,  // 如果有时长传过来就入库，没有就读流格式
          size: size,
        },
        taskId: 0,
        audioSrc: result.url,
        tempAudio: ext === 'mp4' ? `${pcmFilePath}.${ext}` : `${mp3FilePath}.${ext}`,
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
      // 移除音视频
      fs.removeSync(`${targetFilePath}.${ext}`);
      // 腾讯语音转写
      _task_tenncent = await this.tencentAi.createTask(
        {
          audioUrl: ext === 'mp4' ? pcmFilePath + '.pcm' : `${mp3FilePath}.${ext}`,
          mp3Url: result.url
        }, _duration, ext === 'mp4' ? 'pcm' : ext);
      if (_task_tenncent) {
        // 有TaskId代表用的是录音文件转写
        if (_task_tenncent.TaskId) {
          optionsAudio.taskId = _task_tenncent.TaskId;
        } else {// 录音极速版
          optionsAudio.taskDetailed = _task_tenncent.sentence_list;
          optionsAudio.taskText = _task_tenncent.text;
          optionsAudio.taskStatus = 3;
        }
        // 成功就清空
        optionsAudio.tempAudio = '';
        return {
          code: 1, // 成功
          data: optionsAudio,
          isUserTimeSub: true,
          pcm: pcmFilePath + '.pcm',
          mp3: mp3FilePath + '.mp3'
        }
      } else {
        return {
          code: 3, // 腾讯AI转写失败
        }
      }
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
  // 秒杀传验证
  verify(query: any) {
    const { identifier } = query;
    console.log(`identifier ${identifier}, verify`);
    const matchs = glob.sync(`${identifier}.*`, { cwd: UPLOAD_DIR });
    if (matchs.length) {
      return JSON.stringify({
        needUpload: false,
        url: _path.resolve(UPLOAD_DIR, matchs[0]),
      });
    } else {
      const chunkDir = _path.resolve(TEMP_DIR, identifier);
      const chunkFiles = fs.readdirSync(chunkDir);
      return JSON.stringify({
        needUpload: true,
        uploadedChunks: chunkFiles.map(
          (fileName) => {
            var _file: any = fileName.split('-');
            return _file[1] * 1
          }),
      });
    }
  }
}