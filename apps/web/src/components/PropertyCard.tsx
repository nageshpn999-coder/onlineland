import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { AREA_UNITS, getCategory, type Locale } from '@onlineland/shared';
import { Link } from '@/i18n/navigation';
import { formatPrice } from '@/lib/format';
import { placeLabel } from '@/lib/place';
import type { PublicProperty } from '@/lib/property-types';
import { IMAGES_UNOPTIMIZED, photoUrl } from '@/lib/storage-url';
import { FavoriteButton } from './FavoriteButton';
import { AreaIcon, PinIcon } from './icons';
import { PropertyArt } from './PropertyArt';

export function areaText(p: Pick<PublicProperty, 'area' | 'areaUnit'>, locale: Locale) {
  const unit = AREA_UNITS.find((u) => u.id === p.areaUnit);
  const label = unit ? (locale === 'en' && p.area === 1 ? unit.label.en.replace(/s$/, '') : unit.label[locale]) : p.areaUnit;
  return `${p.area.toLocaleString('en-IN')} ${label}`;
}

export function PropertyCard({ property: p, priority = false }: { property: PublicProperty; priority?: boolean }) {
  const t = useTranslations('featured');
  const locale = useLocale() as Locale;
  const title = p.title[locale] || p.title.te || p.title.en;
  const place = placeLabel(p.location, locale);
  const suffix = p.priceBasis === 'per-month' ? t('perMonth') : '';

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[var(--radius-plot)] border border-line bg-paper">
      <div className="relative aspect-[16/10] bg-mist">
        {p.coverPath ? (
          <Image
            src={photoUrl(p.coverPath)}
            alt={title}
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            priority={priority}
            unoptimized={IMAGES_UNOPTIMIZED}
          />
        ) : (
          <PropertyArt category={p.category} />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-paper/95 px-2.5 py-0.5 text-xs font-semibold text-ink">{p.code}</span>
        <FavoriteButton
          className="absolute right-3 top-3 z-10"
          item={{
            id: p.id,
            code: p.code,
            category: p.category,
            purpose: p.purpose,
            title: p.title,
            district: p.location.district,
            mandal: p.location.mandal,
            village: p.location.village,
            total: p.total,
          }}
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm font-medium text-field">
          {getCategory(p.category)?.label[locale]}, {p.purpose === 'rent' ? t('forRent') : t('forSale')}
        </p>
        <h3 className="mt-1 text-[1.2rem] font-semibold leading-snug text-ink">
          <Link href={`/properties/${p.code}`} className="after:absolute after:inset-0 hover:text-brand">
            {title}
          </Link>
        </h3>
        <dl className="mt-3 space-y-1.5 text-[0.95rem] text-ink-soft">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Location</dt>
            <PinIcon className="size-[18px] shrink-0" />
            <dd className="line-clamp-1">{place}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Area</dt>
            <AreaIcon className="size-[18px] shrink-0" />
            <dd>{areaText(p, locale)}</dd>
          </div>
        </dl>
        <div className="mt-auto pt-5">
          <p className="font-display text-[1.45rem] font-bold leading-none text-ink">
            {formatPrice(p.total, locale)}
            {suffix && <span className="ml-1 font-sans text-sm font-normal text-ink-soft">{suffix}</span>}
          </p>
          {p.priceBasis === 'per-unit' && (
            <p className="mt-1.5 text-sm text-ink-soft">
              {formatPrice(p.price, locale)} {t(`perUnit.${p.areaUnit}`)}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
