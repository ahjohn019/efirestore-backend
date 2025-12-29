import { ProductsService } from 'src/modules/products/products.service';

export class Product {
  static async findDuplicateProductSkus(
    productsService: ProductsService,
    checkDuplicateProductIds: number[],
  ) {
    const findDuplicateProducts = await productsService.findBulk(
      checkDuplicateProductIds,
    );

    if (findDuplicateProducts.data.length <= 0) {
      return null;
    }

    const fetchProductSku = findDuplicateProducts.data.map((item) => item.sku);
    const skuDuplicateList = fetchProductSku.join(', ');

    return skuDuplicateList;
  }

  static async findProductIdsNotExists(
    productsService: ProductsService,
    productIds: number[],
  ) {
    const findDuplicateProducts = await productsService.findBulk(productIds);

    const productDbIds = findDuplicateProducts.data.map((item) => item.id);
    const findProductIdsNotExists = productIds.filter(
      (item) => !productDbIds.includes(item),
    );

    return findProductIdsNotExists;
  }

  static async convertToProductIds(module: string, value: any) {
    const findProductIds = {
      CreateStripeDto: value.map(
        (lineItem) => lineItem.price_data?.product_data?.metadata?.id ?? [],
      ),
      CreateOrderDto: value.map(
        (lineItem) => lineItem?.product_id ?? []
      )
    };

    if (!findProductIds[module]) {
      return [];
    }

    return await findProductIds[module];
  }
}
