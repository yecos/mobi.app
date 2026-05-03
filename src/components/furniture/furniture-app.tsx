"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  RotateCcw,
  Share2,
  Heart,
  ShoppingBag,
  ChevronRight,
  Ruler,
  Weight,
  Calendar,
  User,
  Package,
  Clock,
  Check,
  Star,
  Filter,
  Search,
  Sun,
  Moon,
  Grid3X3,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "next-themes";
import {
  furnitureItems,
  categories,
  type FurnitureItem,
  type FurnitureFinish,
} from "@/lib/furniture-data";

const FurnitureViewer = dynamic(
  () => import("./furniture-viewer"),
  { ssr: false }
);

// ─── Catalog Card ────────────────────────────────────────────────────
function FurnitureCard({
  item,
  onClick,
  index,
}: {
  item: FurnitureItem;
  onClick: () => void;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const currentFinish = item.finishes[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileHover={{ y: -4, scale: 1.01 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        className="group cursor-pointer border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-border hover:shadow-xl hover:shadow-black/10"
        onClick={onClick}
      >
        {/* 3D Preview Area */}
        <div className="relative h-48 sm:h-56 bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-20 h-20 rounded-2xl transition-transform duration-500 group-hover:scale-110"
              style={{
                background: `linear-gradient(135deg, ${currentFinish.hex}88, ${currentFinish.hex}22)`,
                boxShadow: `0 8px 32px ${currentFinish.hex}33`,
              }}
            />
          </div>
          {/* Finish dots */}
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {item.finishes.slice(0, 4).map((finish) => (
              <div
                key={finish.id}
                className="w-3 h-3 rounded-full border border-white/20 transition-transform hover:scale-125"
                style={{ backgroundColor: finish.hex }}
              />
            ))}
          </div>
          {/* Category badge */}
          <Badge
            variant="secondary"
            className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-xs"
          >
            {item.category}
          </Badge>
          {/* Stock badge */}
          {!item.inStock && (
            <Badge
              variant="destructive"
              className="absolute top-3 right-3 text-xs"
            >
              Bajo pedido
            </Badge>
          )}
          {/* Hover overlay */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/40 backdrop-blur-[2px] flex items-center justify-center"
              >
                <span className="text-sm font-medium text-foreground/80 flex items-center gap-1">
                  Ver detalle <ChevronRight className="w-4 h-4" />
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-sm leading-tight">{item.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{item.designer}, {item.year}</p>
            </div>
            <span className="text-sm font-bold whitespace-nowrap">
              {item.price.toLocaleString("es-ES")}
              <span className="text-xs text-muted-foreground ml-0.5">EUR</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{item.description.slice(0, 80)}...</p>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Detail View ─────────────────────────────────────────────────────
function FurnitureDetail({
  item,
  onBack,
}: {
  item: FurnitureItem;
  onBack: () => void;
}) {
  const [selectedFinish, setSelectedFinish] = useState(item.finishes[0]?.id || "");
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState("specs");
  const currentFinish = item.finishes.find((f) => f.id === selectedFinish) || item.finishes[0];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col"
    >
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setIsLiked(!isLiked)}
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${
                        isLiked ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Favorito</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Compartir</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
            {/* 3D Viewer */}
            <div className="space-y-4">
              <div className="relative aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden border border-border/40 bg-gradient-to-br from-muted/20 to-muted/5">
                <FurnitureViewer item={item} selectedFinish={selectedFinish} />
                {/* Viewer controls overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <Badge variant="secondary" className="bg-background/60 backdrop-blur-sm text-xs pointer-events-auto">
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Arrastra para rotar
                  </Badge>
                  <Badge variant="secondary" className="bg-background/60 backdrop-blur-sm text-xs">
                    3D
                  </Badge>
                </div>
              </div>

              {/* Finish selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Acabado</h4>
                  <span className="text-xs text-muted-foreground">{currentFinish?.name}</span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {item.finishes.map((finish) => (
                    <button
                      key={finish.id}
                      onClick={() => setSelectedFinish(finish.id)}
                      className={`relative w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                        selectedFinish === finish.id
                          ? "border-primary scale-110 shadow-lg"
                          : "border-border/40"
                      }`}
                      style={{ backgroundColor: finish.hex }}
                      title={finish.name}
                    >
                      {selectedFinish === finish.id && (
                        <Check className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Info Panel */}
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {item.category}
                  </Badge>
                  {item.inStock ? (
                    <Badge className="bg-emerald-500/15 text-emerald-500 border-0 text-xs">
                      En stock
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {item.leadTime}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mt-2">{item.name}</h1>
                <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                  <User className="w-4 h-4" />
                  {item.designer}
                  <Separator orientation="vertical" className="h-4" />
                  <Calendar className="w-4 h-4" />
                  {item.year}
                </p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {item.price.toLocaleString("es-ES")}
                </span>
                <span className="text-muted-foreground text-sm">EUR</span>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>

              <Separator />

              {/* Specs tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="specs" className="flex-1 gap-1.5">
                    <Ruler className="w-3.5 h-3.5" />
                    Especificaciones
                  </TabsTrigger>
                  <TabsTrigger value="materials" className="flex-1 gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Materiales
                  </TabsTrigger>
                  <TabsTrigger value="features" className="flex-1 gap-1.5">
                    <Star className="w-3.5 h-3.5" />
                    Destacados
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="specs" className="mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Ruler, label: "Ancho", value: `${item.dimensions.width} cm` },
                      { icon: Ruler, label: "Profundidad", value: `${item.dimensions.depth} cm` },
                      { icon: Ruler, label: "Altura", value: `${item.dimensions.height} cm` },
                      ...(item.dimensions.seatHeight
                        ? [{ icon: Ruler, label: "Altura asiento", value: `${item.dimensions.seatHeight} cm` }]
                        : []),
                      { icon: Weight, label: "Peso", value: `${item.weight} kg` },
                      { icon: Clock, label: "Entrega", value: item.leadTime },
                    ].map((spec, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                      >
                        <spec.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">{spec.label}</p>
                          <p className="text-sm font-medium">{spec.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="materials" className="mt-4">
                  <div className="space-y-3">
                    {item.materials.map((material, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                      >
                        <div
                          className="w-8 h-8 rounded-lg"
                          style={{
                            background: `linear-gradient(135deg, ${item.finishes[i % item.finishes.length]?.hex || "#888"}, ${item.finishes[(i + 1) % item.finishes.length]?.hex || "#666"})`,
                          }}
                        />
                        <span className="text-sm font-medium">{material}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="features" className="mt-4">
                  <div className="space-y-2">
                    {item.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3 p-2">
                        <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <Separator />

              {/* Actions */}
              <div className="flex gap-3">
                <Button className="flex-1 h-12 text-sm gap-2" size="lg">
                  <ShoppingBag className="w-4 h-4" />
                  {item.inStock ? "Añadir al carrito" : "Reservar pedido"}
                </Button>
                <Button variant="outline" size="lg" className="h-12 gap-2">
                  <Sparkles className="w-4 h-4" />
                  Personalizar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────
export default function FurnitureApp() {
  const [selectedItem, setSelectedItem] = useState<FurnitureItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [gridCols, setGridCols] = useState<2 | 3>(2);
  const { theme, setTheme } = useTheme();

  const filteredItems = furnitureItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "Todos" || item.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.designer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleBack = useCallback(() => {
    setSelectedItem(null);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AnimatePresence mode="wait">
        {selectedItem ? (
          <FurnitureDetail key={selectedItem.id} item={selectedItem} onBack={handleBack} />
        ) : (
          <motion.div
            key="catalog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-14 sm:h-16">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">M</span>
                    </div>
                    <div>
                      <h1 className="font-bold text-lg leading-tight">Mobili</h1>
                      <p className="text-[10px] text-muted-foreground leading-tight hidden sm:block">
                        Mobiliario de Diseño
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Grid toggle */}
                    <div className="hidden sm:flex items-center border border-border/40 rounded-lg overflow-hidden">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-none ${gridCols === 2 ? "bg-muted" : ""}`}
                        onClick={() => setGridCols(2)}
                      >
                        <Grid3X3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-none ${gridCols === 3 ? "bg-muted" : ""}`}
                        onClick={() => setGridCols(3)}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Theme toggle */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                      {theme === "dark" ? (
                        <Sun className="w-4 h-4" />
                      ) : (
                        <Moon className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Search */}
                <div className="pb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, diseñador o descripción..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/30 border border-border/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div className="flex gap-2 pb-3 overflow-x-auto scrollbar-none">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "ghost"}
                      size="sm"
                      className={`rounded-full whitespace-nowrap text-xs shrink-0 ${
                        selectedCategory === category
                          ? ""
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </header>

            {/* Catalog Grid */}
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Colección</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {filteredItems.length} pieza{filteredItems.length !== 1 ? "s" : ""} de diseño
                  </p>
                </div>
              </div>

              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Filter className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium">Sin resultados</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Intenta con otra categoría o término de búsqueda
                  </p>
                </div>
              ) : (
                <div
                  className={`grid gap-4 sm:gap-6 ${
                    gridCols === 3
                      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                      : "grid-cols-1 sm:grid-cols-2"
                  }`}
                >
                  {filteredItems.map((item, index) => (
                    <FurnitureCard
                      key={item.id}
                      item={item}
                      index={index}
                      onClick={() => setSelectedItem(item)}
                    />
                  ))}
                </div>
              )}
            </main>

            {/* Footer */}
            <footer className="border-t border-border/40 mt-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-[10px]">M</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Mobili — Mobiliario de Diseño Contemporáneo
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Inspirado en Madera.app · Hecho con Three.js & Next.js
                  </p>
                </div>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
