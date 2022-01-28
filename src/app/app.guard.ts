import { CanActivate, ExecutionContext, HttpException, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { ToolsService } from "../utils/tools.service";

@Injectable()
export class AppGuard implements CanActivate {
  constructor(private readonly toolsService: ToolsService) { }
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    // 读取token
    const token = request.headers['app-access-token']
    if (!token) {
      throw new HttpException({ code: 4001, msg: 'Token不存在' }, 200);
    }
    return this.toolsService.validateToken(token);
  }
}