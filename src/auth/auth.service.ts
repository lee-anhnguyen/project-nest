import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterUserDto } from 'src/auth/dto/register-user.dto';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from 'src/auth/dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(register: RegisterUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email: register.email },
    });

    if (user?.id) {
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }

    const hashPassword = await this.hashPassword(register.password);
    return await this.userRepository.save({
      ...register,
      password: hashPassword,
      refetch_token: 'refetch_token',
    });
  }
  async login(login: LoginUserDto): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email: login.email },
    });

    if (!user) {
      throw new HttpException('Email is not exist', HttpStatus.UNAUTHORIZED);
    }

    const checkPass = bcrypt.compareSync(login.password, user.password);
    if (!checkPass) {
      throw new HttpException(
        'Password is not correct',
        HttpStatus.UNAUTHORIZED,
      );
    }

    //generate access_token and refresh_token
    const payload = {
      id: user.id,
      email: user.email,
    };

    return this.generateToken(payload);
  }

  async refetchToken(refetch_token: string): Promise<any> {
    try {
      const verify = await this.jwtService.verifyAsync(refetch_token, {
        secret: this.configService.get<string>('SECRET'),
      });
      const checkExistToken = await this.userRepository.findOneBy({
        email: verify.email,
        refetch_token,
      });

      if (checkExistToken) {
        return this.generateToken({ id: verify.id, email: verify.email });
      } else {
        throw new HttpException(
          'Refetch token is not valid',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      throw new HttpException(
        'Refetch token is not valid',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  private async generateToken(payload: { id: number; email: string }) {
    const access_token = await this.jwtService.signAsync(payload);
    const refetch_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('SECRET'),
      expiresIn: this.configService.get<string>('EXP_IN_REFETCH_TOKEN'),
    });

    await this.userRepository.update(
      { email: payload.email },
      { refetch_token },
    );

    return { access_token, refetch_token };
  }
  private async hashPassword(password: string): Promise<string> {
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  }
}
