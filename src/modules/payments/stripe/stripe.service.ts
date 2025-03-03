import { Injectable, Inject, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateStripeDto } from './dto/create-stripe.dto';
import { CheckoutIdStripeDto } from './dto/checkout-id-stripe.dto';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { ProductsService } from 'src/modules/products/products.service';
import { Product } from '../../../utils/product';
import { Helper } from '../../../utils/helper';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_PAYMENT_DEV_SECRET_KEY'),
      {
        apiVersion: '2025-01-27.acacia',
      },
    );
  }

  @Inject(UsersService)
  private readonly usersService: UsersService;

  @Inject(ProductsService)
  private readonly productsService: ProductsService;

  async customValidation(createStripeDto: CreateStripeDto){
    const findLineItemIds = createStripeDto?.line_items.map((lineItem) => lineItem.price_data?.product_data?.metadata?.id) ?? [];
    const findDuplicateIds = Helper.checkDuplicateIdsExists(findLineItemIds);

    const findDuplicateProduct = await Product.findDuplicateProductSkus(this.productsService, findDuplicateIds);
    const findProductIdsNotExists = await Product.findProductIdsNotExists(this.productsService, findLineItemIds);

    const errors = [];

    if(findDuplicateProduct){
      errors.push({"sku" : `SKU: ${findDuplicateProduct} cannot be repeated on current item lists, please resubmit again.`});
    }

    if(findProductIdsNotExists){
      errors.push({"product_ids" : `Product Ids ${findProductIdsNotExists} not found.`});
    }

    return errors;
  }

  async checkout(createStripeDto: CreateStripeDto) {
    const errors = await this.customValidation(createStripeDto);

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    // const session = await this.stripe.checkout.sessions.create(createStripeDto);
    // return { status: true, data: session };
  }

  async checkoutGet(checkoutIdStripeDto: CheckoutIdStripeDto) {
    const session = await this.stripe.checkout.sessions.retrieve(
      checkoutIdStripeDto.checkoutId,
    );
    return { status: true, data: session };
  }

  async checkoutGetLineItems(checkoutIdStripeDto: CheckoutIdStripeDto) {
    const session = await this.stripe.checkout.sessions.listLineItems(
      checkoutIdStripeDto.checkoutId,
    );
    return { status: true, data: session };
  }

  async postWebhook(request: {headers: string, rawBody: Buffer}){
    const signature = request.headers['stripe-signature'];
    const event = this.stripe.webhooks.constructEvent(request.rawBody, signature, this.configService.get<string>('STRIPE_ENDPOINT_SECRET'));

    switch (event.type) {
      case 'checkout.session.completed':
        const fetchCheckoutId = event.data?.object?.id || null;
        const checkoutSuccessPayload = {
          "checkoutId" : fetchCheckoutId
        };
        const checkoutGetData = await this.checkoutGet(checkoutSuccessPayload);

        const { id, status, customer_details } = checkoutGetData.data;

        const fullAddress = customer_details.address.line1 + " " + customer_details.address.line2 + " " + customer_details.address.postal_code + " " + customer_details.address.city + " " + customer_details.address.state + " " + customer_details.address.country;

        const saveOrderPayload = {
          "title": "Order " + id,
          "status": status,
          "shipping_address": fullAddress,
          "billing_address": fullAddress
        }


        console.log('checkoutGetDataCompleted', checkoutGetData);
        break;
    
      default:
        throw new NotFoundException('Event type not found.');
    }
  }
}
