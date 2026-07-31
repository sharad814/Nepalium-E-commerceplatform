import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard, ProductCardSkeleton } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchCategories, fetchProducts } from "@/lib/catalog";
import { PROVINCES, districtsOf } from "@/lib/nepal";

type SortKey = "newest" | "price-asc" | "price-desc" | "rating" | "discount";

type ShopSearch = {
  q?: string | undefined;
  category?: string | undefined;
  province?: string | undefined;
  district?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  minRating?: number | undefined;
  inStock?: boolean | undefined;
  sort?: SortKey | undefined;
  page?: number | undefined;
};

const PAGE_SIZE = 12;

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => {
    const str = (key: string) =>
      typeof search[key] === "string" && search[key] !== "" ? (search[key] as string) : undefined;
    const num = (key: string) =>
      search[key] != null && search[key] !== "" ? Number(search[key]) : undefined;
    const sort = search["sort"];
    return {
      q: str("q"),
      category: str("category"),
      province: str("province"),
      district: str("district"),
      minPrice: num("minPrice"),
      maxPrice: num("maxPrice"),
      minRating: num("minRating"),
      inStock: search["inStock"] === true || search["inStock"] === "true" ? true : undefined,
      sort: (["newest", "price-asc", "price-desc", "rating", "discount"] as const).includes(
        sort as SortKey,
      )
        ? (sort as SortKey)
        : "newest",
      page: num("page") ?? 1,
    };
  },
  head: () => ({
    meta: [
      { title: "Shop All Products — Nepalium Marketplace" },
      {
        name: "description",
        content:
          "Browse thousands of products from verified Nepali sellers. Filter by category, province, district, price and rating.",
      },
      { property: "og:title", content: "Shop All Products — Nepalium Marketplace" },
      {
        property: "og:description",
        content: "Filter Nepal's marketplace by category, province, price and rating.",
      },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const page = search.page ?? 1;

  const setSearch = (patch: Partial<ShopSearch>) =>
    void navigate({
      search: (prev: ShopSearch): ShopSearch => ({ ...prev, ...patch, page: patch.page ?? 1 }),
    });

  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const products = useQuery({
    queryKey: ["products", "shop", search],
    placeholderData: keepPreviousData,
    queryFn: () =>
      fetchProducts({
        search: search.q,
        category: search.category,
        province: search.province,
        district: search.district,
        minPrice: search.minPrice,
        maxPrice: search.maxPrice,
        minRating: search.minRating,
        inStockOnly: search.inStock,
        sort: search.sort,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
  });

  const total = products.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(
    search.q ||
      search.category ||
      search.province ||
      search.district ||
      search.minPrice ||
      search.maxPrice ||
      search.minRating ||
      search.inStock,
  );

  const filters = (
    <div className="space-y-6">
      <div>
        <Label htmlFor="filter-search">Search</Label>
        <Input
          id="filter-search"
          defaultValue={search.q ?? ""}
          placeholder="Product name"
          className="mt-2"
          onKeyDown={(e) => {
            if (e.key === "Enter") setSearch({ q: e.currentTarget.value || undefined });
          }}
        />
      </div>

      <div>
        <Label>Category</Label>
        <Select
          value={search.category ?? "all"}
          onValueChange={(v) => setSearch({ category: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(categories.data ?? []).map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Province</Label>
        <Select
          value={search.province ?? "all"}
          onValueChange={(v) =>
            setSearch({ province: v === "all" ? undefined : v, district: undefined })
          }
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="All provinces" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All provinces</SelectItem>
            {PROVINCES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>District</Label>
        <Select
          value={search.district ?? "all"}
          onValueChange={(v) => setSearch({ district: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="All districts" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">All districts</SelectItem>
            {districtsOf(search.province).map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="min-price">Min price</Label>
          <Input
            id="min-price"
            type="number"
            min={0}
            className="mt-2"
            defaultValue={search.minPrice ?? ""}
            onBlur={(e) =>
              setSearch({ minPrice: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
        <div>
          <Label htmlFor="max-price">Max price</Label>
          <Input
            id="max-price"
            type="number"
            min={0}
            className="mt-2"
            defaultValue={search.maxPrice ?? ""}
            onBlur={(e) =>
              setSearch({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
      </div>

      <div>
        <Label>Minimum rating</Label>
        <Select
          value={String(search.minRating ?? 0)}
          onValueChange={(v) => setSearch({ minRating: Number(v) || undefined })}
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any rating</SelectItem>
            <SelectItem value="3">3★ and up</SelectItem>
            <SelectItem value="4">4★ and up</SelectItem>
            <SelectItem value="4.5">4.5★ and up</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="in-stock"
          checked={Boolean(search.inStock)}
          onCheckedChange={(v) => setSearch({ inStock: v === true ? true : undefined })}
        />
        <Label htmlFor="in-stock" className="cursor-pointer">
          In stock only
        </Label>
      </div>

      {hasFilters && (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() =>
            void navigate({ search: { sort: search.sort, page: 1 } as ShopSearch })
          }
        >
          <X className="size-4" /> Clear filters
        </Button>
      )}
    </div>
  );

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Shop the marketplace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {total} product{total === 1 ? "" : "s"} from verified sellers across Nepal.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="hidden rounded-2xl border border-border bg-card p-6 shadow-soft lg:block h-fit sticky top-24">
            <p className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
              <SlidersHorizontal className="size-4" /> Filters
            </p>
            {filters}
          </aside>

          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <details className="lg:hidden w-full rounded-2xl border border-border bg-card p-4">
                <summary className="cursor-pointer text-sm font-medium">Filters</summary>
                <div className="mt-4">{filters}</div>
              </details>

              <Select
                value={search.sort ?? "newest"}
                onValueChange={(v) => setSearch({ sort: v as SortKey })}
              >
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest arrivals</SelectItem>
                  <SelectItem value="price-asc">Price: low to high</SelectItem>
                  <SelectItem value="price-desc">Price: high to low</SelectItem>
                  <SelectItem value="rating">Top rated</SelectItem>
                  <SelectItem value="discount">Biggest discount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {products.isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : total === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-16 text-center">
                <p className="font-display text-lg font-semibold">No products found</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try removing a filter or searching for something else.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {products.data!.items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {pageCount > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setSearch({ page: page - 1 })}
                >
                  Previous
                </Button>
                <span className="px-3 text-sm text-muted-foreground">
                  Page {page} of {pageCount}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= pageCount}
                  onClick={() => setSearch({ page: page + 1 })}
                >
                  Next
                </Button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
