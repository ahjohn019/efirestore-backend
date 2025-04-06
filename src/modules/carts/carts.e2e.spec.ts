import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { CartsService } from './carts.service';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Carts, CartItems } from './entities/carts.entity';
import { Products } from '../products/entities/products.entity';
import { Users } from '../users/entities/users.entity';
import { ConfigModule } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { dataSourceOptions } from 'src/config/datasource';
dotenv.config();

describe('Carts', () => {
  let app: INestApplication;
  let url: string;
  let token: string;
  let cartsService: CartsService;
  let createCartResponse: any;
  let userId: number;

  const cartItemPayload = {
    user_id: 1,
    product_id: 1,
    quantity: 3,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot(dataSourceOptions),
        TypeOrmModule.forFeature([Carts, CartItems, Products, Users]),
      ],
      providers: [CartsService],
    }).compile();

    app = moduleRef.createNestApplication();
    cartsService = moduleRef.get<CartsService>(CartsService);
    url = 'http://' + process.env.APP_URL + ':' + process.env.PORT;
    userId = 1;

    const loginResponse = await request(url)
      .post('/auth/login')
      .send({ email: 'admin_one@email.com', password: '1111aaaa' })
      .expect(200);

    token = loginResponse.body.data;

    await app.init();
  });

  beforeEach(async () => {
    createCartResponse = await request(url)
      .post('/cart/create-cart-items')
      .set('Authorization', `Bearer ${token}`)
      .send(cartItemPayload);
  });

  it(`/GET find and create cart by id`, async () => {
    const findCartResponse = await request(url)
      .post('/cart/find-cart/' + userId)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const { code, data } = findCartResponse.body;

    expect(code).toBe(200);
    expect(data.user_id).toBe(userId);
  });

  it(`/GET viewCartSummary`, async () => {
    const viewCartSummaryResponse = await request(url)
      .get('/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({
        page: 1,
        total: 20,
      })
      .expect(200);

    const { code, data } = viewCartSummaryResponse.body;

    expect(code).toBe(200);
    expect(data).toHaveProperty('quantity');
    expect(data).toHaveProperty('subtotal');
    expect(data).toHaveProperty('grand_total');
    expect(data).toHaveProperty('cart_items');

    expect(data.cart_items).toBeInstanceOf(Array);
    expect(data.cart_items.length).toBeGreaterThan(0);

    expect(data.quantity).toBe(cartItemPayload.quantity);
  });

  it('/POST createCartItems', async () => {
    expect(createCartResponse.body.code).toBe(200);
    expect(createCartResponse.body.data).toHaveProperty('id');
  });

  it(`/DELETE deleteCartItem - cart item exists`, async () => {
    const deleteResponse = await request(url)
      .delete('/cart/delete-cart-item')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cart_id: createCartResponse.body.data.id,
        product_id: cartItemPayload.product_id,
      })
      .expect(200);

    const { code, data } = deleteResponse.body;

    expect(code).toBe(200);
    expect(data).toBe(true);
  });

  afterEach(async () => {
    await request(url)
      .delete('/cart/delete-cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: createCartResponse.body.data.id });
  });

  afterAll(async () => {
    await app.close();
  });
});
