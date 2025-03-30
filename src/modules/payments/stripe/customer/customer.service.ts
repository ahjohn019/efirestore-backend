import {
  Injectable,
  Inject,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { BaseStripeService } from '../base-stripe.service';
import { CustomerStripeDto } from '../dto/customer-stripe.dto';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { StripeUsers } from 'src/modules/payments/stripe/entities/stripe.entity';
import { UpdateStripeDto } from '../dto/update-stripe.dto';
import { Users } from 'src/modules/users/entities/users.entity';

@Injectable()
export class StripeCustomerService extends BaseStripeService {
  constructor(
    protected configService: ConfigService,

    @InjectRepository(StripeUsers)
    private stripeUsersRepository: Repository<StripeUsers>,

    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {
    super(configService);
  }

  /**
   * Create Stripe Customer Data
   * @param customerStripeDto
   * @returns
   */
  async create(customerStripeDto: CustomerStripeDto) {
    const checkUserByEmail = await this.usersRepository.findOne({
      where: { email: customerStripeDto.email },
    });

    const checkStripeUserExist = await this.stripeUsersRepository.findOne({
      where: { user_id: checkUserByEmail.id },
    });

    if (checkStripeUserExist) {
      throw new NotFoundException('Stripe user already exists.');
    }

    if (!checkUserByEmail) {
      throw new NotFoundException('User not found.');
    }

    const stripeCreateCustomerResponse =
      await this.createCustomerStripe(customerStripeDto);

    const payload = {
      user_id: checkUserByEmail.id,
      stripe_account_id: stripeCreateCustomerResponse.id,
    };

    const response = await this.stripeUsersRepository.save(payload);

    return { status: true, data: response };
  }

  /**
   * Create Stripe Customer Api
   * @param customerStripeDto
   * @returns
   */
  async createCustomerStripe(customerStripeDto: CustomerStripeDto) {
    return await this.stripe.customers.create(customerStripeDto);
  }

  /**
   * Check stripe customer exists
   * @param id
   * @returns
   */
  async show(id: number) {
    const checkStripeUserExist = await this.stripeUsersRepository.findOne({
      where: { user_id: id },
    });

    const response = checkStripeUserExist
      ? await this.stripe.customers.retrieve(
          checkStripeUserExist.stripe_account_id,
        )
      : null;

    return { status: true, data: response };
  }

  /**
   * Update stripe customer data
   * @param updateStripeDto
   * @returns
   */
  async update(updateStripeDto: UpdateStripeDto) {
    const checkStripeUserExist = await this.stripeUsersRepository.findOne({
      where: { user_id: updateStripeDto.metadata.user_id },
    });

    const stripeUpdateCustomerResponse = checkStripeUserExist
      ? await this.stripe.customers.update(
          checkStripeUserExist.stripe_account_id,
          updateStripeDto,
        )
      : null;

    return { status: true, data: stripeUpdateCustomerResponse };
  }
}
