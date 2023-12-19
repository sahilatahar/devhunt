import { Metadata } from 'next';
import categories from '@/utils/categories';
import ProductsService from '@/utils/supabase/services/products';
import CategoryService from '@/utils/supabase/services/categories';
import ToolCardEffect from '@/components/ui/ToolCardEffect/ToolCardEffect';
import Page404 from '@/components/ui/Page404/Page404';
import { Product } from '@/utils/supabase/types';
import { createServerClient } from '@/utils/supabase/server';
import Logo from '@/components/ui/ToolCard/Tool.Logo';
import Name from '@/components/ui/ToolCard/Tool.Name';
import Tags from '@/components/ui/ToolCard/Tool.Tags';
import Title from '@/components/ui/ToolCard/Tool.Title';
import Votes from '@/components/ui/ToolCard/Tool.Votes';
import ToolCard from '@/components/ui/ToolCard/ToolCard';

const getOriginalSlug = (slug: string) => {
  const getValidSlug = categories.filter(item => slug.replaceAll('-', ' ') == item.name.toLowerCase());
  return getValidSlug[0].name;
};

export async function generateMetadata({ params: { slug } }: { params: { slug: string } }): Promise<Metadata> {
  if (getOriginalSlug(slug))
    return {
      title: `Best ${getOriginalSlug(slug)} Tools`,
      metadataBase: new URL('https://devhunt.org'),
      alternates: {
        canonical: `/tools/${slug}`,
      },
      openGraph: {
        title: `Best ${getOriginalSlug(slug)} Tools`,
      },
      twitter: {
        title: `Best ${getOriginalSlug(slug)} Tools`,
      },
    };
  else
    return {
      title: '404: This page could not be found.',
      description: '',
    };
}

export default async ({ params: { slug } }: { params: { slug: string } }) => {
  const productService = new ProductsService(createServerClient());
  const categoryService = new CategoryService(createServerClient());

  const categoryName = getOriginalSlug(slug);

  // Fetch the category
  const categories: any = await categoryService.search(categoryName);
  if (categories.length == 0) return <Page404 />;
  const category = categories.find((c: { name: string }) => c.name.toLowerCase() === categoryName.toLowerCase());

  // Fetch the products
  const { data: products } = await productService.getProducts(
    'votes_count',
    false,
    50,
    1,
    category.id,
    productService.EXTENDED_PRODUCT_SELECT_WITH_CATEGORIES,
  );

  return (
    <section className="max-w-4xl mt-5 lg:mt-10 mx-auto px-4 md:px-8">
      <>
        <>
          <h1 className="text-xl text-slate-50 font-extrabold">Best {getOriginalSlug(slug)} tools</h1>
          <ul className="mt-10 mb-12 divide-y divide-slate-800/60">
            {products.map((product: Product, idx: number) => (
              <li className="py-3">
                <ToolCard tool={product} href={`/tool/${product.slug}`}>
                  <Logo src={product.logo_url || ''} alt={product.name} />
                  <div className="space-y-1">
                    <Name href={product.demo_url as string}>{product.name}</Name>
                    <Title className="line-clamp-2">{product.slogan}</Title>
                    <Tags
                      items={[
                        (product.product_pricing_types as { title: string }).title || 'Free',
                        ...(product.product_categories as { name: string }[]).map((c: { name: string }) => c.name),
                      ]}
                    />
                  </div>
                </ToolCard>
              </li>
            ))}
          </ul>
        </>
      </>
    </section>
  );
};