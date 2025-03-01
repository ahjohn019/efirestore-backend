import { ProductsService } from 'src/modules/products/products.service';

export class Product {
    static async findDuplicateProductSkus(productsService: ProductsService, checkDuplicateProductIds: number[]){
        const findDuplicateProducts = await productsService.findBulk(
            checkDuplicateProductIds,
        );

        if(findDuplicateProducts.length <= 0){
            return null;
        }

        const fetchProductSku = findDuplicateProducts.map((item) => item.sku);
        const skuDuplicateList = fetchProductSku.join(', ');
        
        return skuDuplicateList;
    }

    static async findProductIdsNotExists(productsService: ProductsService, productIds: number[]){
        const findProducts = await productsService.findBulk(
            productIds,
        );

        const productDbIds = findProducts.map((item) => item.id);
        const findProductIdsNotExists = productIds.filter((item) => !productDbIds.includes(item));
        const joinProductIdsNotExists = findProductIdsNotExists.join(', ');
        
        return joinProductIdsNotExists;
    }
}