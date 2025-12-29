import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { dataSourceOptions } from 'src/config/datasource';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Orders } from './entities/orders.entity';
import { Users } from '../users/entities/users.entity';
import { OrdersService } from './orders.service';
import { IsUserEmail } from 'src/shared/validation/user/is_user_email';
import * as dotenv from 'dotenv';
dotenv.config();

describe('Orders', () => {
  let app: INestApplication;
  let url: string;
  let token: string;
  let ordersService: OrdersService;
  let orderId: number;
  let createOrderResponse: any;
  let orderData: any;
  let userEmail: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot(dataSourceOptions),
        TypeOrmModule.forFeature([Orders, Users]),
      ],
      providers: [OrdersService, IsUserEmail],
    }).compile();

    app = moduleRef.createNestApplication();
    url = 'http://' + process.env.APP_URL + ':' + process.env.PORT;
    ordersService = moduleRef.get<OrdersService>(OrdersService);
    userEmail = 'admin_one@email.com';

    const loginResponse = await request(url)
      .post('/auth/login')
      .send({ email: userEmail, password: '1111aaaa' })
      .expect(200);

    token = loginResponse.body.data;

    await app.init();
  });

  beforeEach(async () => {
    const mockCreateOrder = {
      title: userEmail,
      status: 'success',
      shipping_address: 'asdasd',
      billing_address: 'adasdas',
      customer_email: userEmail,
      items: [
        {
          quantity: 1,
          unit_price: 12,
          product_id: 1,
        },
        {
          quantity: 10,
          unit_price: 24,
          product_id: 2,
        },
      ],
    };

    createOrderResponse = await request(url)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(mockCreateOrder);

    orderData = createOrderResponse.body.data;
    orderId = orderData.id;
  });

  it('Create Order', async () => {
    expect(orderData).toHaveProperty('id');
    expect(createOrderResponse.body.code).toBe(200);
  });

  it('Find All Order', async () => {
    const pagination = {
      page: 1,
      take: 1,
    };

    const findAllResponse = await request(url)
      .get('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(pagination)
      .expect(200);

    const { code, data } = findAllResponse.body;

    const responseFindAllData = data.data.length;
    const responseCurrentPage = data.current_page;
    const responseNextPage = data.next_page;
    const actualNextPage = pagination.page;

    expect(code).toBe(200);
    expect(responseFindAllData).toBe(pagination.take);
    expect(responseCurrentPage).toBe(pagination.page);
    expect(responseNextPage).toBe(actualNextPage);
  });

  it('Find One Order', async () => {
    const findOneResponse = await request(url)
      .get('/orders/' + orderId)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const { code, data } = findOneResponse.body;

    expect(data.id).toBe(orderId);
    expect(code).toBe(200);
    expect(data).toHaveProperty('items');
    expect(data.items).toBeInstanceOf(Array);
    expect(data.items.length).toBeGreaterThan(0);

    expect(data.user).toBeInstanceOf(Object);
    expect(data.admin).toBeInstanceOf(Object);

    expect(data.user.email).toBe(userEmail);
  });

  it('Update Order Status', async () => {
    const statusUpdate = {
      status: 'pending',
    };

    const updateOrderStatusResponse = await request(url)
      .patch('/orders/update-status/' + orderId)
      .set('Authorization', `Bearer ${token}`)
      .send(statusUpdate)
      .expect(200);

    expect(updateOrderStatusResponse.body.data.affected).toBe(1);
  });

  it('Delete Order If Order Exists', async () => {
    const deleteOrderResponse = await request(url)
      .delete('/orders/' + orderId)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(deleteOrderResponse.body.data.affected).toBe(1);
  });

  afterEach(async () => {
    await request(url)
      .delete('/orders/' + orderId)
      .set('Authorization', `Bearer ${token}`);
  });

  afterAll(async () => {
    await app.close();
  });
});
