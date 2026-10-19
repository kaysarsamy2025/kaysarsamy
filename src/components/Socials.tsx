import data from "@/data/socials.json";
import { socialSchema } from "@/lib/schemas";
import Icon from "./Icon";

const brandColors: Record<string, string> = {
  LinkedIn: "text-[#0A66C2] hover:text-[#004182]",
  GitHub: "text-[#171515] hover:text-[#000000] dark:text-[#f5f5f5] dark:hover:text-white",
  Instagram: "text-[#E1306C] hover:text-[#C13584]",
  Facebook: "text-[#1877F2] hover:text-[#0B5ED7]",
  WhatsApp: "text-[#25D366] hover:text-[#1DA851]",
  Phone: "text-muted-foreground hover:text-foreground",
  Website: "text-[#4F46E5] hover:text-[#3730A3]",
};

export default function Socials() {
  const socials = socialSchema.parse(data).socials;

  return (
    <section className="flex gap-6">
      {socials.map((item) => (
        <a
          href={item.href}
          key={item.name}
          target="_blank"
          className={brandColors[item.name] ?? "text-muted-foreground hover:text-foreground"}
          rel="noopener noreferrer"
          title={item.name}
        >
          <span className="sr-only">{item.name}</span>
          <Icon name={item.icon} aria-hidden="true" className="size-5" />
        </a>
      ))}
    </section>
  );
}
