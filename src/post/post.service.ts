import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePostDto } from 'src/post/dto/create-post.dto';
import { FilterPostDto } from 'src/post/dto/filter-post.dto';
import { UpdatePostDto } from 'src/post/dto/update-post.dto';
import { Post } from 'src/post/entities/post.entity';
import { User } from 'src/user/entities/user.entity';
import { DeleteResult, Like, Repository, UpdateResult } from 'typeorm';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Post) private postRepository: Repository<Post>,
  ) {}

  async findAll(query: FilterPostDto): Promise<any> {
    const item_per_page = +query.item_per_page || 10;
    const page = +query.page || 1;
    const search = query.search || '';
    const category = +query.category || null;

    const skip = (page - 1) * item_per_page;
    const [res, total] = await this.postRepository.findAndCount({
      where: [
        { title: Like(`%${search}%`), category: { id: category } },
        { description: Like(`%${search}%`), category: { id: category } },
      ],
      order: { created_at: 'DESC' },
      take: item_per_page,
      skip,
      relations: { user: true, category: true },
      select: {
        category: { id: true, name: true },
        user: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          avatar: true,
        },
      },
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

  async findOne(id: number): Promise<any> {
    return await this.postRepository.findOne({
      where: { id },
      relations: ['user', 'category'],
      select: {
        category: { id: true, name: true },
        user: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          avatar: true,
        },
      },
    });
  }

  async create(userId: number, body: CreatePostDto): Promise<Post> {
    const user = await this.userRepository.findOneBy({ id: userId });

    try {
      const res = await this.postRepository.save({ ...body, user });
      return await this.postRepository.findOneBy({ id: res.id });
    } catch (error) {
      throw new HttpException('Can not create post', HttpStatus.BAD_REQUEST);
    }
  }
  async update(id: number, body: UpdatePostDto): Promise<UpdateResult> {
    return await this.postRepository.update(id, body);
  }

  async delete(id: number): Promise<DeleteResult> {
    return await this.postRepository.delete(id);
  }
}
