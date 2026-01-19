"use client";

import {
  useEditor,
  EditorContent,
  type Editor,
  Extension,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Undo,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";
import { Toggle } from "./toggle";
import { Button } from "./button";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAppSelector } from "@/store/hooks";
import { Loader2 } from "lucide-react";

const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return {
      types: ["textStyle"],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) =>
              element.style.fontSize.replace(/['"]+/g, ""),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain()
            .setMark("textStyle", { fontSize: null })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [currentHeading, setCurrentHeading] = useState("p");
  const { user } = useAppSelector((state) => state.auth);
  const token = user?.token;

  const [galleryImages, setGalleryImages] = useState<
    { url: string; name: string }[]
  >([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [galleryPage, setGalleryPage] = useState(1);
  const [hasMoreImages, setHasMoreImages] = useState(true);

  const fetchGalleryImages = async (page = 1) => {
    setIsLoadingGallery(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload/gallery?page=${page}&limit=12`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        if (page === 1) {
          setGalleryImages(data.data.images);
        } else {
          setGalleryImages((prev) => [...prev, ...data.data.images]);
        }
        setHasMoreImages(data.data.pagination.hasMore);
        setGalleryPage(page);
      }
    } catch (error) {
      console.error("Failed to fetch gallery images:", error);
      toast.error("Failed to load gallery");
    } finally {
      setIsLoadingGallery(false);
    }
  };

  useEffect(() => {
    if (!editor) return;

    const updateHeading = () => {
      if (editor.isActive("heading", { level: 1 })) setCurrentHeading("h1");
      else if (editor.isActive("heading", { level: 2 }))
        setCurrentHeading("h2");
      else if (editor.isActive("heading", { level: 3 }))
        setCurrentHeading("h3");
      else if (editor.isActive("heading", { level: 4 }))
        setCurrentHeading("h4");
      else if (editor.isActive("heading", { level: 5 }))
        setCurrentHeading("h5");
      else if (editor.isActive("heading", { level: 6 }))
        setCurrentHeading("h6");
      else setCurrentHeading("p");
    };

    editor.on("selectionUpdate", updateHeading);
    editor.on("transaction", updateHeading);
    updateHeading();

    return () => {
      editor.off("selectionUpdate", updateHeading);
      editor.off("transaction", updateHeading);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
      setLinkUrl("");
    }
  };

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size should be less than 10MB");
        return;
      }

      const toastId = toast.loading("Uploading image...");

      try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/upload/image`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Upload failed");
        }

        const data = await response.json();
        const imageUrl = data.data?.url || data.url;

        if (!imageUrl) {
          throw new Error("No image URL in response");
        }

        editor.chain().focus().setImage({ src: imageUrl }).run();

        toast.success("Image uploaded successfully!", { id: toastId });
      } catch (error) {
        console.error("Image upload error:", error);
        toast.error(
          `Failed to upload: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          { id: toastId }
        );
      }
    }
  };

  return (
    <div className="border-b p-2 flex flex-wrap gap-1 items-center bg-muted/20">
      <Select
        value={currentHeading}
        onValueChange={(value) => {
          if (value === "p") {
            editor.chain().focus().setParagraph().run();
          } else {
            editor
              .chain()
              .focus()
              .toggleHeading({ level: parseInt(value.replace("h", "")) as any })
              .run();
          }
        }}
      >
        <SelectTrigger className="w-[120px] h-8">
          <SelectValue placeholder="Paragraph" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="p">Paragraph</SelectItem>
          <SelectItem value="h1">Heading 1</SelectItem>
          <SelectItem value="h2">Heading 2</SelectItem>
          <SelectItem value="h3">Heading 3</SelectItem>
          <SelectItem value="h4">Heading 4</SelectItem>
          <SelectItem value="h5">Heading 5</SelectItem>
          <SelectItem value="h6">Heading 6</SelectItem>
        </SelectContent>
      </Select>

      <div className="w-px h-6 bg-border mx-1" />

      <Select
        value={editor.getAttributes("textStyle").fontSize || "default"}
        onValueChange={(value) => {
          if (value === "default") {
            editor
              .chain()
              .focus()
              .setMark("textStyle", { fontSize: null })
              .removeEmptyTextStyle()
              .run();
          } else {
            editor
              .chain()
              .focus()
              .setMark("textStyle", { fontSize: value })
              .run();
          }
        }}
      >
        <SelectTrigger className="w-[100px] h-8">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">14px (Default)</SelectItem>
          <SelectItem value="12px">12px</SelectItem>
          <SelectItem value="16px">16px</SelectItem>
          <SelectItem value="18px">18px</SelectItem>
          <SelectItem value="20px">20px</SelectItem>
          <SelectItem value="24px">24px</SelectItem>
          <SelectItem value="30px">30px</SelectItem>
          <SelectItem value="36px">36px</SelectItem>
        </SelectContent>
      </Select>

      <div className="w-px h-6 bg-border mx-1" />

      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>

      <div className="w-px h-6 bg-border mx-1" />

      <Toggle
        size="sm"
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("blockquote")}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </Toggle>

      <div className="w-px h-6 bg-border mx-1" />

      <Popover>
        <PopoverTrigger asChild>
          <Toggle size="sm" pressed={editor.isActive("link")}>
            <LinkIcon className="h-4 w-4" />
          </Toggle>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
            <Button size="sm" onClick={setLink}>
              Add
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ImageIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="url">URL</TabsTrigger>
              <TabsTrigger
                value="gallery"
                onClick={() => fetchGalleryImages(1)}
              >
                Gallery
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-3 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Upload Image
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-3 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Image URL
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  <Button size="sm" onClick={addImage}>
                    Add
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="mt-4">
              <div className="space-y-3">
                <label className="text-sm font-medium mb-2 block">
                  Select from Gallery
                </label>
                {isLoadingGallery ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : galleryImages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center p-4">
                    No images found
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-1">
                      {galleryImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square cursor-pointer overflow-hidden rounded-md border hover:border-blue-500 transition-colors group"
                          onClick={() => {
                            editor
                              .chain()
                              .focus()
                              .setImage({ src: img.url })
                              .run();
                            toast.success("Image added from gallery");
                          }}
                        >
                          <img
                            src={img.url}
                            alt={img.name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
                          />
                        </div>
                      ))}
                    </div>
                    {hasMoreImages && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => fetchGalleryImages(galleryPage + 1)}
                        disabled={isLoadingGallery}
                      >
                        {isLoadingGallery ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Load More"
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
};

export function RichTextEditor({
  content,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class: "rounded-lg cursor-pointer",
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || "Write something amazing...",
      }),
      TextStyle,
      Color,
      FontSize,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[300px] p-4",
      },
    },
    immediatelyRender: false,
  });

  return (
    <>
      <style jsx global>{`
        .ProseMirror {
          font-size: 14px;
          line-height: 1.6;
          max-width: 100% !important;
        }

        .ProseMirror p {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          line-height: 1.6;
        }

        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          cursor: move;
          display: block;
          margin: 1em 0;
        }

        .ProseMirror img.ProseMirror-selectednode {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
        }

        /* Reduce spacing for headings */
        .ProseMirror h1,
        .ProseMirror h2,
        .ProseMirror h3,
        .ProseMirror h4,
        .ProseMirror h5,
        .ProseMirror h6 {
          margin-top: 1em;
          margin-bottom: 0.5em;
          line-height: 1.3;
        }

        /* Reduce list spacing */
        .ProseMirror ul,
        .ProseMirror ol {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          padding-left: 1.5em;
        }

        .ProseMirror li {
          margin-top: 0.25em;
          margin-bottom: 0.25em;
        }

        /* Reduce blockquote spacing */
        .ProseMirror blockquote {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          padding-left: 1em;
          border-left: 3px solid #e5e7eb;
        }
      `}</style>
      <div className="border rounded-md overflow-hidden bg-background">
        <MenuBar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </>
  );
}
