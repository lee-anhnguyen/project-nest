import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { User } from 'src/user/entities/user.entity';
import { DeleteResult, Like, Repository, UpdateResult } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';
import { FilterUserDto } from 'src/user/dto/filter-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async findAll(query: FilterUserDto): Promise<any> {
    const item_per_page = +query.item_per_page || 10;
    const page = +query.page || 1;
    const skip = (page - 1) * item_per_page;
    const keyword = `%${query.search || ''}%`;

    const [res, total] = await this.userRepository.findAndCount({
      where: [
        { first_name: Like(keyword) },
        { last_name: Like(keyword) },
        { email: Like(keyword) },
      ],
      order: { created_at: 'DESC' },
      take: item_per_page,
      skip,
      select: [
        'id',
        'first_name',
        'last_name',
        'email',
        'status',
        'created_at',
        'updated_at',
      ],
    });

    const lastPage = Math.ceil(total / item_per_page);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;

    return {
      data: res,
      total,
      currentPage: page,
      nextPage,
      prevPage,
      lastPage,
    };
  }

  async findOne(id: number): Promise<User> {
    return await this.userRepository.findOneBy({ id });
  }

  async create(body: CreateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email: body.email },
    });

    if (user?.id) {
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }

    const hashPassword = await bcrypt.hash(body.password, 10);
    return await this.userRepository.save({ ...body, password: hashPassword });
  }

  async update(id: number, body: UpdateUserDto): Promise<UpdateResult> {
    return await this.userRepository.update(id, body);
  }

  async delete(id: number): Promise<DeleteResult> {
    return await this.userRepository.delete(id);
  }

  async updateAvatar(id: number, avatar: string): Promise<UpdateResult> {
    return await this.userRepository.update(id, { avatar });
  }
}
