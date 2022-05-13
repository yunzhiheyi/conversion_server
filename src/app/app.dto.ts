import { IsEmpty, IsMobilePhone, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
// 发送验证码DTO
export class SendsmsDto {
  readonly username: string;
  @ApiProperty({ description: '手机号', example: '17790183715' })
  @IsNotEmpty()
  @IsMobilePhone()
  readonly mobile: string;

  @ApiProperty({ description: '验证码类型', example: '1' })
  @IsNotEmpty()
  readonly smsType: number;
}

export class CreateUserDto {
  readonly username: string;

  @ApiProperty({ description: '手机号', example: '17790183715' })
  @IsNotEmpty()
  @IsMobilePhone()
  readonly mobile: string;

  @ApiProperty({ description: '验证码', example: '111111' })
  @IsNotEmpty()
  readonly code: string;

  @ApiProperty({ description: '邀请码', example: '111111' })
  @IsNotEmpty()
  readonly inviter_code: string;

  @ApiProperty({ description: '系统类型', example: 'ios' })
  @IsNotEmpty()
  readonly systemType: string;

}

export class LoginUserDto {
  @IsNotEmpty()
  readonly mobile: string;
}

// _id 查询

export class idDto {
  @IsNotEmpty()
  readonly id: string;
}

// taskId 查询

export class taskId {
  @IsNotEmpty()
  readonly taskId: string;
}

// code
export class codeDto {
  // 手机登录code
  @ApiProperty({ description: '手机登录code', })
  @IsNotEmpty()
  readonly phonecode: string;
  // 登录code
  @ApiProperty({ description: '登录code' })
  @IsNotEmpty()
  readonly logincode: string;
  // 邀请码
  @ApiProperty({ description: '邀请码' })
  @IsNotEmpty()
  readonly inviter_code: string;

  @ApiProperty({ description: '系统类型', example: 'ios' })
  @IsNotEmpty()
  readonly systemType: string;
}
// 刷新Token
export class RefreshTokenDto {
  @ApiProperty({ description: '刷新Token' })
  @IsNotEmpty()
  readonly token: string;
}

// 小程序大文件上传
export class MiniprogramFileDto {
  @ApiProperty({ description: 'identifier' })
  @IsNotEmpty()
  identifier: string;
  // 大小
  @ApiProperty({ description: '大小' })
  @IsNotEmpty()
  size: string;
  /// 时间
  @ApiProperty({ description: '时间' })
  @IsNotEmpty()
  duration: string;
  // 视频宽度
  @ApiProperty({ description: '视频宽度' })
  @IsNotEmpty()
  width: string;
  // 视频高度
  @ApiProperty({ description: '视频高度' })
  @IsNotEmpty()
  height: string;
  // 文件名称
  @ApiProperty({ description: '文件名称' })
  @IsNotEmpty()
  fileName: string;
}

// 产品Code
export class ProductCodeDto {
  @ApiProperty({ description: '产品CODE' })
  @IsNotEmpty()
  product_code: string;

  @ApiProperty({ description: 'login code' })
  @IsNotEmpty()
  code: string;
}


// 订单状态
export class OrderUpdateDto {
  @ApiProperty({ description: '订单ID' })
  @IsNotEmpty()
  order_id: string;
}

// 订单ID
export class CreateIdDto {
  @ApiProperty({ description: '订单ID' })
  @IsNotEmpty()
  order_id: string;
}
// 分页
export class pagesDto {
  @ApiProperty({ description: '分类条数', example: '10' })
  @IsNotEmpty()
  readonly pageSize: number;

  @ApiProperty({ description: '当前页码', example: '1' })
  @IsNotEmpty()
  readonly current: number;

  @ApiProperty({ description: '类型', example: '1' })
  @IsNotEmpty()
  readonly taskStatus: number;
}

// 在线提取视频
export class UrlDto {
  @ApiProperty({ description: '解析视频Url', example: '抖音地址' })
  @IsNotEmpty()
  readonly url: number;
}

// 绑定微信号
export class wechatBindDto {
  @ApiProperty({ description: '登录code', example: '登录code' })
  @IsNotEmpty()
  readonly code: string;

  @ApiProperty({ description: '用户头像', example: '用户昵称' })
  @IsNotEmpty()
  readonly avatarUrl: string;

  @ApiProperty({ description: '用户昵称', example: '用户昵称' })
  @IsNotEmpty()
  readonly nickName: string;

  @ApiProperty({ description: '系统类型', example: 'ios' })
  @IsNotEmpty()
  readonly systemType: string;
}

// 关注公众号回调
export class wechatBindofficialAccount {
  @ApiProperty({ description: 'signature', example: 'signature' })
  @IsNotEmpty()
  readonly signature: string;

  @ApiProperty({ description: 'timestamp', example: 'timestamp' })
  @IsNotEmpty()
  readonly timestamp: string;


  @ApiProperty({ description: 'nonce', example: 'nonce' })
  @IsNotEmpty()
  readonly nonce: string;


  @ApiProperty({ description: 'nonce', example: 'nonce' })
  @IsNotEmpty()
  readonly echostr: string;
}