import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/modules/auth/entities/user.entity';

@ValidatorConstraint({ async: true })
@Injectable()
export class UniqueEmailValidator implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async validate(email: string) {
    const user = await this.userRepo.findOne({
      where: { email },
    });

    return !user; // valid if NOT found
  }

  defaultMessage() {
    return 'Email already exists';
  }
}
