import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common"
import * as jwt from "jsonwebtoken"

import { UserService } from "#models/user/service"

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest()
    const authToken = request.headers.authorization

    const jwtSecret = process.env.JWT_SECRET
    if (jwtSecret === undefined) {
      throw new ServiceUnavailableException({ message: "Server has no JWT secret." })
    }

    try {
      jwt.verify(authToken, jwtSecret)
      const decodingResult = jwt.decode(authToken, { json: true })
      if (decodingResult === null) throw new Error()
      request.authorizedUserId = decodingResult.id
      request.authorizedUser = await this.userService.findUser({
        id: decodingResult.id,
        relations: { administratedBoards: true, boards: true },
      })
    } catch {
      throw new UnauthorizedException("Invalid token.")
    }

    return true
  }
}
