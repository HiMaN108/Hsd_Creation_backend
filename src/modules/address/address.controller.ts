import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AddressService } from './address.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { JwtAuthGuard } from '../../middleware/jwt-auth.guard';

@ApiTags('Addresses')
@Controller('addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearerAuth')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  @ApiOperation({ summary: 'Get all addresses of current user' })
  findAll(@Req() req: any) {
    return this.addressService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific address' })
  findOne(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.addressService.findOne(req.user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new address' })
  create(@Req() req: any, @Body() dto: CreateAddressDto) {
    return this.addressService.create(req.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an address' })
  update(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an address' })
  remove(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.addressService.remove(req.user.id, id);
  }
}
