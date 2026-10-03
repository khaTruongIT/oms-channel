import { ProductsService } from './products.service';

describe('ProductsService', () => {
  it('stores optical public metadata when creating a product', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'category-1' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'sku-1' }])
      .mockResolvedValueOnce([
        {
          id: 'sku-1',
          sku_code: 'DIGITAL-SHIELD-PRO',
          product_name: 'OPTIQIS Digital Shield Pro',
          category_id: 'category-1',
          category_name: 'Digital Shield',
          variants: null,
          cost_price: '120000',
          public_metadata: {
            slug: 'digital-shield-pro',
            summary: 'Tròng kính lọc ánh sáng xanh chọn lọc.',
            needs: ['screen'],
            indexes: ['1.60'],
            coatings: ['Nano'],
            technologies: ['Selective Wave Filtering'],
            heroImage: 'https://example.com/hero.jpg',
            specsJson: {
              abbe: '32',
              uvProtection: 'UV400',
              recommendedFor: ['Dân văn phòng'],
              wavelength: {
                adverse: '415-455nm',
                beneficial: '465-495nm',
                claim: 'Giảm HEV có hại',
              },
            },
            isFeatured: true,
          },
          created_at: new Date('2026-01-01T00:00:00Z'),
          deleted_at: null,
        },
      ]);
    const service = new ProductsService({ query } as never);

    const product = await service.createProduct(
      {
        skuCode: 'DIGITAL-SHIELD-PRO',
        productName: 'OPTIQIS Digital Shield Pro',
        categoryId: 'category-1',
        costPrice: 120000,
        publicMetadata: {
          slug: 'digital-shield-pro',
          summary: 'Tròng kính lọc ánh sáng xanh chọn lọc.',
          needs: ['screen'],
          indexes: ['1.60'],
          coatings: ['Nano'],
          technologies: ['Selective Wave Filtering'],
          heroImage: 'https://example.com/hero.jpg',
          specsJson: {
            abbe: '32',
            uvProtection: 'UV400',
            recommendedFor: ['Dân văn phòng'],
            wavelength: {
              adverse: '415-455nm',
              beneficial: '465-495nm',
              claim: 'Giảm HEV có hại',
            },
          },
          isFeatured: true,
        },
      },
      'tenant_schema',
    );

    const insertSql = query.mock.calls[2][0] as string;
    const insertParams = query.mock.calls[2][1] as unknown[];
    expect(insertSql).toContain('public_metadata');
    expect(insertParams[5]).toMatchObject({ slug: 'digital-shield-pro' });
    expect(product.publicMetadata?.slug).toBe('digital-shield-pro');
  });

  it('updates optical public metadata without overwriting omitted product fields', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([
        {
          id: 'sku-1',
          sku_code: 'DIGITAL-SHIELD-PRO',
          product_name: 'OPTIQIS Digital Shield Pro',
          public_metadata: {},
          created_at: new Date('2026-01-01T00:00:00Z'),
        },
      ])
      .mockResolvedValueOnce([{ id: 'sku-1' }])
      .mockResolvedValueOnce([
        {
          id: 'sku-1',
          sku_code: 'DIGITAL-SHIELD-PRO',
          product_name: 'OPTIQIS Digital Shield Pro',
          public_metadata: { slug: 'digital-shield-pro' },
          created_at: new Date('2026-01-01T00:00:00Z'),
        },
      ]);
    const service = new ProductsService({ query } as never);

    const product = await service.updateProduct(
      'sku-1',
      { publicMetadata: { slug: 'digital-shield-pro' } },
      'tenant_schema',
    );

    const updateSql = query.mock.calls[1][0] as string;
    const updateParams = query.mock.calls[1][1] as unknown[];
    expect(updateSql).toContain('public_metadata');
    expect(updateParams[0]).toEqual({ slug: 'digital-shield-pro' });
    expect(product.publicMetadata?.slug).toBe('digital-shield-pro');
  });
});
