import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

import { AUTHOR_PROFILE } from "@/assets/contact/info";

interface ContactDialogProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export function ContactDialog({ trigger }: ContactDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        hideClose
        size="md"
        padded={false}
      >
        <DialogClose className="absolute right-6 top-6 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent z-[70]">
          <Icon name="close" size={16} />
        </DialogClose>

        <div className="pt-6 pb-8 px-6 text-center space-y-6">
          <div className="space-y-1">
            <h2 className="text-headline text-foreground">
              {AUTHOR_PROFILE.name}
            </h2>
            <p className="text-body font-medium text-primary uppercase">
              {AUTHOR_PROFILE.role}
            </p>
          </div>

          <div className="bg-muted/50 rounded-card p-4 border border-border text-body italic text-muted-foreground relative mx-2">
            "{AUTHOR_PROFILE.quote}"
          </div>

          <p className="text-body text-muted-foreground px-2">
            {AUTHOR_PROFILE.description}
          </p>

          <div className="flex items-center justify-center gap-4 pt-2">
            <a
              href={AUTHOR_PROFILE.socials.github}
              target="_blank"
              rel="noreferrer"
            >
              <Button
                size="icon"
                variant="outline"
                className="rounded-full hover:bg-muted hover:text-primary border-border"
              >
                <Icon name="github" size={18} />
              </Button>
            </a>
            <a
              href={AUTHOR_PROFILE.socials.linkedin}
              target="_blank"
              rel="noreferrer"
            >
              <Button
                size="icon"
                variant="outline"
                className="rounded-full hover:bg-muted hover:text-primary border-border"
              >
                <Icon name="linkedin" size={18} />
              </Button>
            </a>
            <a
              href={AUTHOR_PROFILE.socials.instagram}
              target="_blank"
              rel="noreferrer"
            >
              <Button
                size="icon"
                variant="outline"
                className="rounded-full hover:bg-muted hover:text-primary border-border"
              >
                <Icon name="instagram" size={18} />
              </Button>
            </a>
            <a href={`mailto:${AUTHOR_PROFILE.socials.email}`}>
              <Button
                size="icon"
                variant="outline"
                className="rounded-full hover:bg-muted hover:text-primary border-border"
              >
                <Icon name="mail" size={18} />
              </Button>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
