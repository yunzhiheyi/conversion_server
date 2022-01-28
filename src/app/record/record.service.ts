
import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import dayjs from 'dayjs';
import { InjectModel } from 'nestjs-typegoose';
import { AppRecord } from '../../models/app/record.model';
@Injectable()
export class RecordService {
  constructor(
    @InjectModel(AppRecord)
    private readonly recordModel: ReturnModelType<typeof AppRecord>,
  ) { }
  // 查询用户的时长列表
  async recordList(user_id: string) {
    const result = await this.recordModel.find({ user_id: user_id }, { _id: 1, type: 1, time: 1, createdAt: 1, recordName: 1 }).sort({ 'createdAt': -1 }).populate(
      [
        {
          path: 'recordName',
          select: { _id: 1, name: 1 },
        }
      ]
    );
    var resultArr = []
    result.map((item) => {
      var _item = {
        _id: item._id,
        type: item.type,
        time: item.time,
        recordName: item.recordName,
        createdAt: dayjs(new Date(item['createdAt'])).format('YYYY-MM-DD HH:mm:ss')
      }
      resultArr.push(_item);
    })
    return resultArr;
  }
}
