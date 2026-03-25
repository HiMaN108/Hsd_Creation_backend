import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async create(userId: number, dto: CreateAddressDto) {
    // If this is the first address or is_default is true, reset other defaults
    if (dto.is_default) {
      await this.addressRepository.update(
        { user_id: userId },
        { is_default: false },
      );
    }

    const address = this.addressRepository.create({
      ...dto,
      user_id: userId,
    });

    return this.addressRepository.save(address);
  }

  async findAll(userId: number) {
    return this.addressRepository.find({
      where: { user_id: userId },
      order: { is_default: 'DESC', created_at: 'DESC' },
    });
  }

  async findOne(userId: number, id: number) {
    const address = await this.addressRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!address) {
      throw new NotFoundException(`Address #${id} not found`);
    }

    return address;
  }

  async update(userId: number, id: number, dto: UpdateAddressDto) {
    const address = await this.findOne(userId, id);

    if (dto.is_default) {
      await this.addressRepository.update(
        { user_id: userId },
        { is_default: false },
      );
    }

    Object.assign(address, dto);
    return this.addressRepository.save(address);
  }

  async remove(userId: number, id: number) {
    const address = await this.findOne(userId, id);
    await this.addressRepository.remove(address);
    return { message: `Address #${id} deleted successfully` };
  }
}
