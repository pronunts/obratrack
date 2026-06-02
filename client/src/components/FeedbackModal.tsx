import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { MessageSquarePlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type FeedbackFormData = {
  type: string;
  content: string;
};

export function FeedbackModal() {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FeedbackFormData>();

  const onSubmit = async (data: FeedbackFormData) => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al enviar el feedback');
      }

      toast.success('¡Gracias por tu feedback!', {
        description: 'Tus comentarios nos ayudan a mejorar ObraTrack.',
      });
      reset();
      setOpen(false);
    } catch (error) {
      toast.error('Ocurrió un error', {
        description: 'No pudimos enviar tu mensaje. Por favor intenta de nuevo.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground text-sm transition-colors text-left mt-2 border border-dashed border-sidebar-border/50">
          <MessageSquarePlus className="w-4 h-4" />
          Danos tu Feedback
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enviar Feedback</DialogTitle>
          <DialogDescription>
            ¿Encontraste un error o tienes alguna sugerencia? Nos encantaría escucharte.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">Tipo de Feedback</label>
            <select
              id="type"
              className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              {...register('type', { required: true })}
            >
              <option value="suggestion">Sugerencia</option>
              <option value="bug">Reportar un error</option>
              <option value="other">Otro</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">Mensaje</label>
            <textarea
              id="content"
              rows={4}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
              placeholder="Cuéntanos más detalles..."
              {...register('content', { required: true })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-md text-sm font-medium hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
