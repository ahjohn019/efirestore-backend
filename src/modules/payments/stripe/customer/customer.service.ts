import { Injectable, NotFoundException, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(StripeCustomerService.name);

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
    try {
      this.logger.log(
        `Preparing Stripe customer create: email=${customerStripeDto.email} hasBilling=${Boolean(
          customerStripeDto.address,
        )} hasShipping=${Boolean(customerStripeDto.shipping)}`,
      );

      const checkUserByEmail = await this.usersRepository.findOne({
        where: { email: customerStripeDto.email },
        relations: ['stripe_users'],
      });

      if (!checkUserByEmail) {
        throw new NotFoundException('User not found.');
      }

      const { stripe_users } = checkUserByEmail;

      if (stripe_users) {
        throw new NotFoundException('Stripe user already exists.');
      }

      const stripeCreateCustomerResponse =
        await this.createCustomerStripe(customerStripeDto);

      this.logger.log(
        `Stripe customer create API success: stripe_customer_id=${stripeCreateCustomerResponse.id} user_id=${checkUserByEmail.id}`,
      );

      const payload = {
        user_id: checkUserByEmail.id,
        stripe_account_id: stripeCreateCustomerResponse.id,
      };

      const response = await this.stripeUsersRepository.save(payload);

      return this.createSuccessResponse(response);
    } catch (error) {
      this.logger.error(
        `Stripe customer create failed: email=${customerStripeDto?.email} error=${error.message}`,
        error.stack,
      );
      return this.createErrorResponse(error.message);
    }
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
    try {
      const checkStripeUserExist = await this.stripeUsersRepository.findOne({
        where: { user_id: id },
      });

      if (!checkStripeUserExist) {
        this.logger.log(
          `No local Stripe customer mapping found for user_id=${id}`,
        );
      } else {
        this.logger.log(
          `Local Stripe customer mapping found for user_id=${id}: stripe_customer_id=${checkStripeUserExist.stripe_account_id}`,
        );
      }

      const response = checkStripeUserExist
        ? await this.stripe.customers.retrieve(
            checkStripeUserExist.stripe_account_id,
          )
        : null;

      return this.createSuccessResponse(response);
    } catch (error) {
      this.logger.error(
        `Stripe customer retrieve failed: user_id=${id} error=${error.message}`,
        error.stack,
      );
      return this.createErrorResponse(error.message);
    }
  }

  /**
   * Update stripe customer data
   * @param updateStripeDto
   * @returns
   */
  async update(updateStripeDto: UpdateStripeDto) {
    try {
      const checkStripeUserExist = await this.stripeUsersRepository.findOne({
        where: { user_id: updateStripeDto.metadata.user_id },
      });

      this.logger.log(
        `Preparing Stripe customer update: user_id=${updateStripeDto.metadata.user_id} stripe_customer_id=${
          checkStripeUserExist?.stripe_account_id || 'missing'
        } hasBilling=${Boolean(updateStripeDto.address)} hasShipping=${Boolean(
          updateStripeDto.shipping,
        )}`,
      );

      const stripeUpdateCustomerResponse = checkStripeUserExist
        ? await this.stripe.customers.update(
            checkStripeUserExist.stripe_account_id,
            updateStripeDto,
          )
        : null;

      if (!checkStripeUserExist) {
        this.logger.warn(
          `Stripe customer update skipped: no local mapping for user_id=${updateStripeDto.metadata.user_id}`,
        );
      } else {
        this.logger.log(
          `Stripe customer update API success: user_id=${updateStripeDto.metadata.user_id} stripe_customer_id=${checkStripeUserExist.stripe_account_id}`,
        );
      }

      return this.createSuccessResponse(stripeUpdateCustomerResponse);
    } catch (error) {
      this.logger.error(
        `Stripe customer update failed: user_id=${updateStripeDto?.metadata?.user_id} error=${error.message}`,
        error.stack,
      );
      return this.createErrorResponse(error.message);
    }
  }
}
