import { Injectable, Logger } from '@nestjs/common';
import { Cron, Interval, Timeout } from '@nestjs/schedule';
import dayjs from 'dayjs';
import axios from 'axios';
@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
  constructor() {
  }
  @Cron('59 59 23 * * *')
  async handleCron() {
    const { data } = await axios.get('https://api-sv.videoparse.cn/api/user/getInfo?appid=nDc8IiUO3J55EURa');
    var time = new Date().getTime() / 1000;
    if (data.body.end_time > time) {
      this.logger.debug('发送短信提示');
    }
  }

  // @Interval(10000)
  // handleInterval() {
  //   // this.logger.debug('2');
  // }

  // @Timeout(5000)
  // handleTimeout() {
  //   // this.logger.debug('3');
  // }

  // @Interval(10000)
  // sendEmail() {
  //   // this.logger.debug('3');
  // }
}
