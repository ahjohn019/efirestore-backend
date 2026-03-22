import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  CreateUserDetailsDto,
  CreateUserAddressDto,
} from './dto/create-user.dto';
import {
  UpdateUserDetailsDto,
  UpdateUserAddressDto,
} from './dto/update-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../../commons/guards/auth';
import { RolesGuard } from '../../commons/guards/roles.guard';
import { Roles } from '../../commons/decorators/roles.decorator';
import { Role } from '../../enum/role.enum';
import { AllUserDto } from './dto/all-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard)
  findAll(@Query() allUserDto: AllUserDto) {
    return this.usersService.findAll(allUserDto);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('/user-details/create')
  createUserDetails(@Body() createUserDetailsDto: CreateUserDetailsDto) {
    return this.usersService.createUsersDetails(createUserDetailsDto);
  }

  @Put('/user-details/update/:id')
  updateUserDetails(
    @Param('id') id: number,
    @Body() updateUserDetailsDto: UpdateUserDetailsDto,
  ) {
    return this.usersService.updateUsersDetails(+id, updateUserDetailsDto);
  }

  @Post('/addresses/create')
  @UseGuards(AuthGuard)
  createUserAddress(
    @Request() req,
    @Body() createUserAddressDto: CreateUserAddressDto,
  ) {
    return this.usersService.createUserAddress(
      req.user.id,
      createUserAddressDto,
    );
  }

  @Put('/addresses/update')
  @UseGuards(AuthGuard)
  updateUserAddress(
    @Request() req,
    @Body() updateUserAddressDto: UpdateUserAddressDto,
  ) {
    return this.usersService.updateUserAddress(
      req.user.id,
      updateUserAddressDto,
    );
  }

  @Delete('/addresses/delete/:id')
  @UseGuards(AuthGuard)
  deleteUserAddress(@Request() req, @Param('id') id: number) {
    return this.usersService.deleteUserAddress(req.user.id, id);
  }

  @Get('/addresses/list')
  @UseGuards(AuthGuard)
  listUserAddresses(@Query() allUserDto: AllUserDto, @Request() req) {
    return this.usersService.listUserAddresses(allUserDto, req.user.id);
  }

  @Get('/addresses/view/:id')
  @UseGuards(AuthGuard)
  viewUserAddress(@Param('id') id: number) {
    return this.usersService.viewUserAddress(+id);
  }

  @Get()
  findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
