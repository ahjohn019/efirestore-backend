import dayjs = require('dayjs');
import { ConfigService } from '@nestjs/config';
import { Orders } from './entities/orders.entity';
import { UserAddress } from '../users/entities/user-address.entity';
import { BadRequestException } from '@nestjs/common';

const subdivisionCities: Record<string, string[]> = {
  'MY-01': ['Johor', 'Johor Bahru'],
  'MY-02': ['Kedah', 'Alor Setar'],
  'MY-03': ['Kelantan', 'Kota Bharu'],
  'MY-04': ['Melaka', 'Malacca'],
  'MY-05': ['Negeri Sembilan', 'Seremban'],
  'MY-06': ['Pahang', 'Kuantan'],
  'MY-07': ['Pulau Pinang', 'Penang', 'George Town', 'Georgetown'],
  'MY-08': ['Perak', 'Ipoh'],
  'MY-09': ['Perlis', 'Kangar'],
  'MY-10': ['Selangor', 'Shah Alam'],
  'MY-11': ['Terengganu', 'Kuala Terengganu'],
  'MY-12': ['Sabah', 'Kota Kinabalu'],
  'MY-13': ['Sarawak', 'Kuching'],
  'MY-14': ['Kuala Lumpur', 'Wilayah Persekutuan Kuala Lumpur'],
  'MY-15': ['Labuan', 'Wilayah Persekutuan Labuan'],
  'MY-16': ['Putrajaya', 'Wilayah Persekutuan Putrajaya'],
};

export function getSubdivisionCodeByCity(city: string): string {
  const normalizedCity = city?.trim().replace(/\s+/g, ' ').toLowerCase();
  const match = Object.entries(subdivisionCities).find(([, cities]) =>
    cities.some((name) => name.toLowerCase() === normalizedCity),
  );
  if (!match) {
    throw new BadRequestException(
      'Cannot determine subdivision code for the shipping city.',
    );
  }
  return match[0];
}

export function buildEasyParcelOrder(
  findOrder: Orders,
  shippingAddress: UserAddress,
  configService: ConfigService,
) {
  return {
    order_id: findOrder.id,
    shipment: [
      {
        service_id: findOrder.easyparcel_service_id,
        collection_date: dayjs(findOrder.created_at).format('YYYY-MM-DD'),
        weight: findOrder.items.reduce(
          (total, item) => total + item.product.weight * item.quantity,
          0,
        ),
        height: 0,
        length: 0,
        width: 0,
        item: findOrder.items.map((item) => ({
          content: item.product.title,
          quantity: item.quantity,
          weight: item.product.weight,
          height: item.product.height,
          length: item.product.length,
          width: item.product.width,
          value: item.unit_price,
          currency_code: 'MYR',
        })),
        sender: {
          name: configService.getOrThrow<string>('EASY_PARCEL_SENDER_NAME'),
          phone_number_country_code: configService.getOrThrow<string>(
            'EASY_PARCEL_SENDER_PHONE_NUMBER_COUNTRY_CODE',
          ),
          phone_number: configService.getOrThrow<string>(
            'EASY_PARCEL_SENDER_PHONE_NUMBER',
          ),
          email: configService.getOrThrow<string>('EASY_PARCEL_SENDER_EMAIL'),
          address_1: configService.getOrThrow<string>(
            'EASY_PARCEL_SENDER_ADDRESS_1',
          ),
          address_2: configService.get<string>('EASY_PARCEL_SENDER_ADDRESS_2'),
          city: configService.getOrThrow<string>('EASY_PARCEL_SENDER_CITY'),
          subdivision_code: configService.getOrThrow<string>(
            'EASY_PARCEL_SENDER_STATE',
          ),
          postcode: configService.getOrThrow<string>(
            'EASY_PARCEL_SENDER_POSTCODE',
          ),
          country_code: configService.getOrThrow<string>(
            'EASY_PARCEL_SENDER_COUNTRY_CODE',
          ),
        },
        receiver: {
          name: findOrder.user.name,
          phone_number: findOrder.user.user_details.phone_number,
          phone_number_country_code: 'MY',
          alternate_phone_number: findOrder.user.user_details.phone_number,
          alternate_phone_number_country_code: 'MY',
          email: findOrder.user.email,
          address_1: shippingAddress.address_line_one,
          address_2: shippingAddress.address_line_two,
          city: findOrder.user.user_details.city,
          subdivision_code: getSubdivisionCodeByCity(
            findOrder.user.user_details.city,
          ),
          postcode: String(shippingAddress.postal_code),
          country_code: 'MY',
        },
      },
    ],
  };
}
