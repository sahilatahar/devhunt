'use client';

import { useSupabase } from '@/components/supabase/provider';
import Button from '@/components/ui/Button/Button';
import CategoryInput from '@/components/ui/CategoryInput';
import { FormLaunchSection, FormLaunchWrapper } from '@/components/ui/FormLaunch';
import { ImageUploaderItem, ImagesUploader } from '@/components/ui/ImagesUploader';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import LabelError from '@/components/ui/LabelError/LabelError';
import LogoUploader from '@/components/ui/LogoUploader/LogoUploader';
import Radio from '@/components/ui/Radio';
import Textarea from '@/components/ui/Textarea';
import createSlug from '@/utils/createSlug';
import { createBrowserClient } from '@/utils/supabase/browser';
import fileUploader from '@/utils/supabase/fileUploader';
import CategoryService from '@/utils/supabase/services/categories';
import ProductPricingTypesService from '@/utils/supabase/services/pricing-types';
import ProductsService from '@/utils/supabase/services/products';
import { ProductCategory, ProductPricingType } from '@/utils/supabase/types';
import { File } from 'buffer';
import { ChangeEvent, useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useParams, useRouter } from 'next/navigation';

type Inputs = {
  tool_name: string;
  tool_website: string;
  tool_description: string;
  slogan: string;
  pricing_type: number;
  github_repo: string;
  demo_video: string;
};

export default () => {
  const { id } = useParams();
  const browserService = createBrowserClient();
  const pricingTypesList = new ProductPricingTypesService(browserService).getAll();
  const productService = new ProductsService(browserService);

  const tool = productService.getById(+id);

  const router = useRouter();

  const { session } = useSupabase();
  const user = session && session.user;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    getValues,
  } = useForm();

  const [categories, setCategory] = useState<ProductCategory[]>([]);
  const [pricingType, setPricingType] = useState<ProductPricingType[]>([]);

  const [imageFiles, setImageFile] = useState<File[]>([]);
  const [imagePreviews, setImagePreview] = useState<string[]>([]);
  const [imagesError, setImageError] = useState<string>('');

  const [logoFile, setLogoFile] = useState<File | Blob>();
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoError, setLogoError] = useState<string>('');

  const [isLogoLoad, setLogoLoad] = useState<boolean>(false);
  const [isImagesLoad, setImagesLoad] = useState<boolean>(false);
  const [isUpdate, setUpdate] = useState<boolean>(false);

  useEffect(() => {
    pricingTypesList.then(types => {
      setPricingType([...(types as ProductPricingType[])]);
    });

    tool.then(data => {
      setLogoPreview(data?.logo_url as string);
      setValue('tool_name', data?.name);
      setValue('tool_website', data?.demo_url);
      setValue('tool_description', data?.description);
      setValue('slogan', data?.slogan);
      setValue('pricing_type', data?.pricing_type);
      setValue('github_repo', data?.github_url);
      setValue('demo_video', data?.demo_video_url);
      setCategory(data?.product_categories as ProductCategory[]);
      setImagePreview(data?.asset_urls as string[]);
    });
  }, []);

  const handleUploadImages = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (file && file.type.includes('image') && imagePreviews.length < 5) {
      setImageFile([...(imageFiles as any), file]);
      setImagesLoad(true);
      fileUploader({ files: file as Blob, options: 'w=512' }).then(data => {
        if (data?.file) {
          setImagePreview([...imagePreviews, data.file as string]);
          setImagesLoad(false);
        }
      });
    }
  };

  const handleUploadLogo = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (file && file.type.includes('image')) {
      setLogoFile(file);
      setLogoLoad(true);
      fileUploader({ files: file as Blob, options: 'w=220' }).then(data => {
        setLogoPreview(data?.file as string);
        setLogoLoad(false);
      });
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImagePreview(imagePreviews.filter((_, i) => i !== idx));
  };

  const validateImages = () => {
    setImageError('');
    setLogoError('');
    if (imagePreviews.length == 0) setImageError('Please choose some screenshots');
    else if (!logoPreview) setLogoError('Please choose product logo');
    else return true;
  };

  const onSubmit: SubmitHandler<Inputs> = data => {
    if (validateImages()) {
      setUpdate(true);
      const { tool_name, tool_website, tool_description, slogan, pricing_type, github_repo, demo_video } = data;
      const categoryIds: number[] = categories.map(category => category.id);
      productService
        .update(
          +id,
          {
            asset_urls: imagePreviews,
            name: tool_name,
            demo_url: tool_website,
            github_url: github_repo,
            pricing_type,
            slogan,
            description: tool_description,
            logo_url: logoPreview,
            demo_video_url: demo_video,
          },
          categoryIds,
        )
        .then(res => {
          setUpdate(false);
          window.alert('Your launch has been updated successfully');
          window.open(`/tool/${res?.slug}`);
        });
    }
  };

  return (
    <section className="container-custom-screen">
      <h1 className="text-xl text-slate-50 font-semibold">Edit Launch</h1>
      <div className="mt-14">
        <FormLaunchWrapper onSubmit={handleSubmit(onSubmit as () => void)}>
          <FormLaunchSection number={1} title="Tell us about your tool" description="This basic information is important for the users.">
            <div>
              <LogoUploader isLoad={isLogoLoad} src={logoPreview} onChange={handleUploadLogo} />
              <LabelError className="mt-2">{logoError}</LabelError>
            </div>
            <div>
              <Label>Tool name</Label>
              <Input
                placeholder="Dev Hunt"
                className="w-full mt-2"
                validate={{ ...register('tool_name', { required: true, minLength: 3 }) }}
              />
              <LabelError className="mt-2">{errors.tool_name && 'Please enter your tool name'}</LabelError>
            </div>
            <div>
              <Label>Slogan</Label>
              <Input
                placeholder="Find the best new DevTools in tech"
                className="w-full mt-2"
                validate={{ ...register('slogan', { required: true, minLength: 20 }) }}
              />
              <LabelError className="mt-2">{errors.solgan && 'Please enter your tool slogan'}</LabelError>
            </div>
            <div>
              <Label>Tool website URL</Label>
              <Input
                placeholder="https://devhunt.org/"
                className="w-full mt-2"
                validate={{
                  ...register('tool_website', { required: true, pattern: /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)*$/i }),
                }}
              />
              <LabelError className="mt-2">{errors.solgan && 'Please enter your tool website URL'}</LabelError>
            </div>
            <div>
              <Label>Github repo URL (optional)</Label>
              <Input
                placeholder="https://github.com/MarsX-dev/devhunt"
                className="w-full mt-2"
                validate={{
                  ...register('github_repo', { required: false, pattern: /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)*$/i }),
                }}
              />
            </div>
            <div>
              <Label>Description of the tool</Label>
              <Textarea
                placeholder="Write a description: 220 characters, HTML is supported."
                className="w-full h-36 mt-2"
                validate={{
                  ...register('tool_description', { required: true, maxLength: 220 }),
                }}
              />
              <LabelError className="mt-2">{errors.solgan && 'Please enter your tool description'}</LabelError>
            </div>
          </FormLaunchSection>
          <FormLaunchSection number={2} title="Extras" description="Help people find you easily by providing pricing type and categories. ">
            <div>
              <Label>Tool pricing type</Label>
              {pricingType.map((item, idx) => (
                <Controller
                  key={idx}
                  name="pricing_type"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <div className="mt-2 flex items-center gap-x-2">
                      <Radio
                        checked={item.id == getValues('pricing_type')}
                        value="free"
                        onChange={e => field.onChange(item.id)}
                        id={item.title as string}
                        name="pricing-type"
                      />
                      <Label htmlFor={item.title as string} className="font-normal">
                        {item.title}
                      </Label>
                    </div>
                  )}
                />
              ))}
              <LabelError className="mt-2">{errors.solgan && 'Please select your tool pricing type'}</LabelError>
            </div>
            <div>
              <Label>Tool categories (optional)</Label>
              <CategoryInput className="mt-2" categories={categories} setCategory={setCategory} />
            </div>
          </FormLaunchSection>
          <FormLaunchSection number={3} title="Media" description="Make people engage with your tool by providing great images">
            <div>
              <Label>Demo video (optional)</Label>
              <Input
                placeholder="A simple demo video URL from youtube"
                className="w-full mt-2"
                validate={{
                  ...register('demo_video', { required: false, pattern: /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)*$/i }),
                }}
              />
            </div>
            <div>
              <Label>Tool screenshots</Label>
              <p className="text-sm text-slate-400">The first image will be used as the social preview. upload at least 3-5 images.</p>
              <ImagesUploader isLoad={isImagesLoad} className="mt-4" files={imagePreviews as []} max={5} onChange={handleUploadImages}>
                {imagePreviews.map((src, idx) => (
                  <ImageUploaderItem src={src} key={idx} onRemove={() => handleRemoveImage(idx)} />
                ))}
              </ImagesUploader>
              <LabelError className="mt-2">{imagesError}</LabelError>
            </div>
            <div className="mt-3">
              <Button isLoad={isUpdate} type="submit" className="w-full hover:bg-orange-400 ring-offset-2 ring-orange-500 focus:ring">
                Update
              </Button>
            </div>
          </FormLaunchSection>
        </FormLaunchWrapper>
      </div>
    </section>
  );
};