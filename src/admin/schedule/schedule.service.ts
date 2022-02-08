import { Injectable, Logger } from '@nestjs/common';
import { Cron, Interval, Timeout } from '@nestjs/schedule';
import dayjs from 'dayjs';
import { UploadService } from '../upload/upload.service';
import axios from 'axios';
// 定时任务服务
@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
  constructor(
    private readonly uploadService: UploadService
  ) { }
  // 短视频解析到期提醒
  async videoExpiration() {
    const { data } = await axios.get('https://api-sv.videoparse.cn/api/user/getInfo?appid=nDc8IiUO3J55EURa');
    var time = new Date().getTime() / 1000;
    if (data.body.end_time > time) {
      this.logger.debug('发送短信提示');
    }
  }
  // 每天24点执行任务
  @Cron('59 59 23 * * *')
  async handleCron() {
    this.videoExpiration();
    // 删除非必要文件释放空间
    await this.uploadService.pollingDeleteImage();
  }

  @Interval(10000)
  async handleInterval() {
    // this.logger.debug('2');
    // await this.uploadService.pollingDeleteImage();
  }


}
