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
    let createMockOrder: any;

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
        // orderId = 15;

        const loginResponse = await request(url)
            .post('/auth/login')
            .send({ email: 'admin_one@email.com', password: '1111aaaa' })
            .expect(200);

        token = loginResponse.body.data;

        const mockCreateOrder = {
            "title": "admin_one@email.com",
            "status": "success",
            "shipping_address": "asdasd",
            "billing_address": "adasdas",
            "customer_email": "admin_one@email.com",
            "items": [
                {
                    "quantity": 1,
                    "unit_price": 12,
                    "product_id": 1
                },
                {
                    "quantity": 10,
                    "unit_price": 24,
                    "product_id": 2
                }
            ]
        }

        createOrderResponse = await request(url)
            .post('/orders')
            .set('Authorization', `Bearer ${token}`)
            .send(mockCreateOrder)
            .expect(201);

        orderId = createOrderResponse.body.data.id;

        console.log('orderId', orderId);

        await app.init();
    });

    it('Find All Order', async () => {
        const pagination = {
            page: 1,
            take: 1
        }

        const findAllResponse = await request(url)
            .get('/orders')
            .set('Authorization', `Bearer ${token}`)
            .send(pagination)
            .expect(200);

        console.log('findAllResponse', findAllResponse);

        const responseFindAllData = findAllResponse.body.data.data.length;
        const responseCurrentPage = findAllResponse.body.data.current_page;
        const responseNextPage = findAllResponse.body.data.next_page;
        const actualNextPage = pagination.page;

        expect(responseFindAllData).toBe(pagination.take);
        expect(responseCurrentPage).toBe(pagination.page);
        expect(responseNextPage).toBe(actualNextPage);
    });

    it('Find One Order', async () => {
        const findOneResponse = await request(url)
            .get('/orders/' + orderId)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(findOneResponse.body.data.id).toBe(orderId);
    });

    it('Update Order Status', async () => {
        const statusUpdate = {
            status: "pending"
        }

        const updateOrderStatusResponse = await request(url)
            .patch('/orders/update-status/' + orderId)
            .set('Authorization', `Bearer ${token}`)
            .send(statusUpdate)
            .expect(200);

        expect(updateOrderStatusResponse.body.data.affected).toBe(1);
    })

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
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    })

    afterAll(async () => {
        await app.close();
    });
});
