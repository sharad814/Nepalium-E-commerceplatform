import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  MapPin,
  Star,
  Store,
  Truck,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductRail } from "@/components/site/ProductRail";
import { fetchCategories, fetchProducts, fetchTopStores } from "@/lib/catalog";
import { brand } from "@/lib/branding";
import { PROVINCES } from "@/lib/nepal";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nepalium — Buy Local from Verified Nepali Sellers" },
      {
        name: "description",
        content:
          "Nepalium is Nepal's multi-vendor marketplace for organic produce, handicrafts, tea, tools and more from verified sellers in every province.",
      },
      { property: "og:title", content: "Nepalium — Buy Local from Verified Nepali Sellers" },
      {
        property: "og:description",
        content: "Shop fresh produce, handicrafts and local goods from across Nepal.",
      },
    ],
  }),
  component: HomePage,
});

const SLIDES = [
  {
    eyebrow: "Farm to doorstep",
    title: "Fresh from Nepal's terraces",
    body: "Organic vegetables, fruits and honey shipped straight from growers in Ilam, Jumla and the Terai belt.",
    cta: "Shop fresh produce",
    search: { category: "vegetables" },
    image:
      "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1400&q=80",
  },
  {
    eyebrow: "Handmade in Nepal",
    title: "Crafts with a story behind them",
    body: "Dhaka weaves, singing bowls and pashmina made by artisan families in the Kathmandu valley.",
    cta: "Explore handicrafts",
    search: { category: "handicrafts" },
    image:
      "https://images.unsplash.com/photo-1528181304800-259b08848526?w=1400&q=80",
  },
  {
    eyebrow: "Grow your business",
    title: "Sell to all seven provinces",
    body: "Verified seller accounts, admin-reviewed listings and payouts you can trust.",
    cta: "Become a seller",
    search: undefined,
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400&q=80",
  },
];

function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  const slide = SLIDES[index]!;

  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      <img
        key={slide.image}
        src={slide.image}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 size-full object-cover opacity-25 transition-opacity duration-700"
      />
      <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-2xl text-primary-foreground">
          <Badge className="mb-4 bg-accent text-accent-foreground">{slide.eyebrow}</Badge>
          <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            {slide.title}
          </h1>
          <p className="mt-4 max-w-xl text-base opacity-90 sm:text-lg">{slide.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full bg-gradient-gold text-accent-foreground hover:opacity-90">
              <Link
                to={slide.search ? "/shop" : "/become-seller"}
                search={slide.search as never}
              >
                {slide.cta} <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/shop">Browse marketplace</Link>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-sm opacity-90">
            <span className="flex items-center gap-2">
              <BadgeCheck className="size-4" /> Admin-verified sellers
            </span>
            <span className="flex items-center gap-2">
              <Truck className="size-4" /> Delivery in all 77 districts
            </span>
            <span className="flex items-center gap-2">
              <Store className="size-4" /> eSewa · Khalti · COD
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-10 bg-accent" : "w-5 bg-primary-foreground/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryGrid() {
  const { data } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">Shop by category</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            From farm produce to handmade crafts and equipment.
          </p>
        </div>
        <Button asChild variant="ghost" className="gap-1">
          <Link to="/categories">
            All categories <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(data ?? []).map((cat) => (
          <Link
            key={cat.id}
            to="/shop"
            search={{ category: cat.slug } as never}
            className="card-lift rounded-2xl border border-border bg-card p-5 text-center shadow-soft"
          >
            <span className="mx-auto grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
              <Sparkles className="size-5" />
            </span>
            <p className="mt-3 text-sm font-medium">{cat.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProvinceStrip() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-display text-xl font-semibold">Buy from your province</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Support local sellers and get faster delivery.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {PROVINCES.map((p) => (
            <Link key={p} to="/shop" search={{ province: p } as never}>
              <Badge
                variant="secondary"
                className="cursor-pointer rounded-full px-4 py-2 text-sm hover:bg-primary hover:text-primary-foreground"
              >
                <MapPin className="mr-1 size-3.5" /> {p}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function TopSellers() {
  const { data } = useQuery({ queryKey: ["top-stores"], queryFn: fetchTopStores });
  if (!data?.length) return null;
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <h2 className="font-display text-2xl font-semibold sm:text-3xl">Top rated sellers</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.map((store) => (
          <Link
            key={store.id}
            to="/store/$slug"
            params={{ slug: store.slug }}
            className="card-lift rounded-2xl border border-border bg-card p-5 shadow-soft"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-gradient-brand text-primary-foreground">
                <Store className="size-5" />
              </span>
              <div>
                <p className="font-semibold">{store.name}</p>
                <p className="text-xs text-muted-foreground">
                  {store.district}, {store.province}
                </p>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-1 text-sm">
              <Star className="size-4 fill-accent text-accent" />
              <span className="font-medium">{Number(store.rating).toFixed(1)}</span>
              <span className="text-muted-foreground">seller rating</span>
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Stats() {
  const items = [
    { icon: Store, value: "1,200+", label: "Verified sellers" },
    { icon: Users, value: "85,000+", label: "Happy customers" },
    { icon: MapPin, value: "77", label: "Districts covered" },
    { icon: Truck, value: "98%", label: "On-time delivery" },
  ];
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-4 rounded-3xl bg-gradient-brand p-8 text-primary-foreground sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <item.icon className="mx-auto size-6 opacity-90" />
            <p className="mt-3 font-display text-3xl font-semibold">{item.value}</p>
            <p className="text-sm opacity-80">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    {
      name: "Sabina Shrestha",
      city: "Lalitpur",
      text: "The Ilam tea arrived within two days and tasted better than anything I get locally. Ordering from the actual grower makes a difference.",
    },
    {
      name: "Bikash Thapa",
      city: "Pokhara",
      text: "I run a small farm supply shop. Getting approved as a seller took a day and my listings started selling the same week.",
    },
    {
      name: "Anita Karki",
      city: "Biratnagar",
      text: "Paying with eSewa and tracking my order right down to delivery made this feel far more trustworthy than social media shops.",
    },
  ];
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <h2 className="font-display text-2xl font-semibold sm:text-3xl">What shoppers say</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {quotes.map((q) => (
          <figure key={q.name} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-4 fill-accent text-accent" />
              ))}
            </div>
            <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
              “{q.text}”
            </blockquote>
            <figcaption className="mt-4 text-sm font-medium">
              {q.name} · <span className="text-muted-foreground">{q.city}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-soft sm:p-12">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">
          Get deals before everyone else
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Daily rotating offers, new harvest alerts and seller stories — one email a week, no spam.
        </p>
        <form
          className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.includes("@")) {
              toast.error("Please enter a valid email address");
              return;
            }
            setEmail("");
            toast.success("You're subscribed to Nepalium updates");
          }}
        >
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address"
            className="h-11 rounded-full"
          />
          <Button type="submit" size="lg" className="rounded-full">
            Subscribe
          </Button>
        </form>
      </div>
    </section>
  );
}

function HomePage() {
  const deals = useQuery({
    queryKey: ["products", "deals"],
    queryFn: () => fetchProducts({ dealsOnly: true, limit: 10 }),
  });
  const featured = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => fetchProducts({ featuredOnly: true, limit: 10 }),
  });
  const newest = useQuery({
    queryKey: ["products", "newest"],
    queryFn: () => fetchProducts({ sort: "newest", limit: 10 }),
  });
  const bestRated = useQuery({
    queryKey: ["products", "best"],
    queryFn: () => fetchProducts({ sort: "rating", limit: 10 }),
  });
  const discounted = useQuery({
    queryKey: ["products", "discount"],
    queryFn: () => fetchProducts({ sort: "discount", limit: 10 }),
  });

  return (
    <SiteLayout>
      <HeroSlider />
      <CategoryGrid />

      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-sm font-medium text-primary">
          <Clock className="size-4" />
          Today&apos;s deals refresh every day at midnight — {brand.name} rotates the offers
          automatically.
        </div>
      </section>

      <ProductRail
        title="Today's deals"
        subtitle="A fresh set of discounted products every single day."
        products={deals.data?.items ?? []}
        loading={deals.isLoading}
      />
      <ProductRail
        title="Best deals & discounts"
        subtitle="Biggest savings on the marketplace right now."
        products={discounted.data?.items ?? []}
        loading={discounted.isLoading}
      />
      <ProvinceStrip />
      <ProductRail
        title="Featured products"
        subtitle="Hand-picked by our marketplace team."
        products={featured.data?.items ?? []}
        loading={featured.isLoading}
      />
      <ProductRail
        title="New arrivals"
        subtitle="The latest listings approved on Nepalium."
        products={newest.data?.items ?? []}
        loading={newest.isLoading}
      />
      <ProductRail
        title="Best rated products"
        subtitle="Loved by customers across Nepal."
        products={bestRated.data?.items ?? []}
        loading={bestRated.isLoading}
      />
      <TopSellers />
      <Stats />
      <Testimonials />
      <Newsletter />
    </SiteLayout>
  );
}
