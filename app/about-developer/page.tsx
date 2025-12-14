"use client";

import { useState } from "react";
// import { useMutation } from "convex/react";
// import { api } from "@/convex/_generated/api";
// import { useUserKey } from "@/lib/session";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Mail, MapPin, Briefcase, Github, Linkedin, Globe } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AboutDeveloperPage() {
  const { toast } = useToast();
  // const userKey = useUserKey();
  // const sendMessage = useMutation(api.messages.sendMessage);

  // const [name, setName] = useState("");
  // const [email, setEmail] = useState("");
  // const [message, setMessage] = useState("");
  // const [isSending, setIsSending] = useState(false);

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!message.trim()) return;

  //   const subject = encodeURIComponent(`Contact Form: ${name} (${email})`);
  //   const body = encodeURIComponent(message);
    
  //   // Open default mail client
  //   window.location.href = `mailto:tubat.mark09@gmail.com?subject=${subject}&body=${body}`;

  //   toast({
  //     title: "Opening Email Client",
  //     description: "Redirecting you to your email application to send the message.",
  //   });

  //   // Reset form
  //   setName("");
  //   setEmail("");
  //   setMessage("");
  // };

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">About the Developer</h1>
          <p className="text-muted-foreground text-lg">
            Building modern web experiences with passion and precision.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Developer Profile */}
          <Card className="h-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-32 w-32 rounded-full overflow-hidden border-4 border-muted flex items-center justify-center bg-muted">
                <Avatar className="h-full w-full">
                  <AvatarFallback className="text-4xl">MD</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-2xl">Mark Dev</CardTitle>
              <CardDescription>Full Stack Developer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-5 w-5 text-primary" />
                  <span>tubat.mark09@gmail.com</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>Philippines</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <span className="text-green-600 font-medium">Open for Work</span>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="font-semibold mb-4">Connect</h3>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" size="icon" asChild>
                    <a href="https://github.com/TubatMark" target="_blank" rel="noopener noreferrer">
                      <Github className="h-5 w-5" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href="https://www.linkedin.com/in/mark-anthony-tubat-7ab065279/" target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-5 w-5" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href="https://m4rk-dev.vercel.app/" target="_blank" rel="noopener noreferrer">
                      <Globe className="h-5 w-5" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Section */}
          <Card className="flex flex-col justify-center items-center p-8 text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Get in Touch</CardTitle>
              <CardDescription className="text-lg">
                Have a project in mind or just want to say hi?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 gap-2"
                onClick={() => {
                  window.location.href = "mailto:tubat.mark09@gmail.com?subject=Contact%20Inquiry";
                  toast({
                    title: "Opening Email",
                    description: "Launching your default email client...",
                  });
                }}
              >
                <Mail className="h-6 w-6" />
                Send me an Email
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                Or email directly at <span className="font-medium text-foreground">tubat.mark09@gmail.com</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
