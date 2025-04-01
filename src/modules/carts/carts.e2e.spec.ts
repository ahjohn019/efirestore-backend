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

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                }),
                TypeOrmModule.forRoot(dataSourceOptions),
                TypeOrmModule.forFeature([Carts, CartItems, Products, Users])
            ],
            providers: [CartsService],
        })
            .compile();

        app = moduleRef.createNestApplication();
        cartsService = moduleRef.get<CartsService>(CartsService);
        url = "http://" + process.env.APP_URL + ":" + process.env.PORT;

        const loginResponse = await request(url)
            .post('/auth/login')
            .send({ email: 'admin_one@email.com', password: '1111aaaa' })
            .expect(200);

        token = loginResponse.body.data;

        await app.init();
    });

    it(`/GET viewCartSummary`, async () => {
        return await request(url)
            .get('/cart')
            .set('Authorization', `Bearer ${token}`)
            .send({
                "page": 1,
                "total": 20
            })
            .expect(200);
    });

    it('/POST createCartItems', async () => {
        const mockCartItem = {
            user_id: 1,
            product_id: 1,
            quantity: 3
        };

        const cartItemResponse = await request(url)
            .post('/cart/create-cart-items')
            .set('Authorization', `Bearer ${token}`)
            .send(mockCartItem)
            .expect(201);

        await request(url)
            .delete('/cart/delete-cart')
            .set('Authorization', `Bearer ${token}`)
            .send({ id: cartItemResponse.body.data.id })
            .expect(200);
    });

    afterAll(async () => {
        await app.close();
    });
});