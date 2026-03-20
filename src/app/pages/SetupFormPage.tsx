import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form';
import { toast } from 'sonner';
import { ApiError } from '@/services/api/client';
import { setupService, SetupRequest } from '@/services/api/setup';
import { authService } from '@/services/api/auth';
import { Role } from '@/services/api/types';
import { Eye, EyeOff, Settings, ShieldCheck, Users } from 'lucide-react';
import { Checkbox } from '@/app/components/ui/checkbox';
import { FRAMEWORK_SUITE_OPTIONS } from '@/app/features/tests/frameworkSuites';

const setupSchema = z
  .object({
    organizationName: z
      .string()
      .min(2, 'Organization name must be at least 2 characters'),
    adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
    adminEmail: z.string().email('Please enter a valid email address'),
    adminPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character',
      ),
    orgAdminName: z
      .string()
      .min(2, 'Organization admin name must be at least 2 characters'),
    orgAdminEmail: z.string().email('Please enter a valid email address'),
    orgAdminPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character',
      ),
    selectedFrameworks: z.array(z.string()).default([]),
  })
  .refine((data) => data.adminEmail !== data.orgAdminEmail, {
    message: 'Admin emails must be different',
    path: ['orgAdminEmail'],
  });

type SetupFormData = z.output<typeof setupSchema>;

export function SetupFormPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showOrgAdminPassword, setShowOrgAdminPassword] = useState(false);

  const form = useForm<z.input<typeof setupSchema>, any, SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      organizationName: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      orgAdminName: '',
      orgAdminEmail: '',
      orgAdminPassword: '',
      selectedFrameworks: ['iso-cloud-hardening'],
    },
  });

  const onSubmit = async (data: SetupFormData) => {
    setIsLoading(true);
    try {
      const response = await setupService.setup(data as SetupRequest);

      if (response.success) {
        toast.success('System setup completed successfully!');

        // Store the token for future use
        if (response.data?.token) {
          authService.setToken(response.data.token);
        }
        authService.cacheUser({
          id: response.data?.superAdmin.id ?? '',
          email: response.data?.superAdmin.email ?? data.adminEmail,
          name: response.data?.superAdmin.name ?? data.adminName,
          role: Role.SUPER_ADMIN,
          organizationId: response.data?.organization.id ?? '',
          createdAt:
            response.data?.organization.createdAt ?? new Date().toISOString(),
        });
        const activatedFrameworks =
          response.data?.activatedFrameworks?.filter(
            (item) => item.status === 200,
          ).length ?? 0;
        const createdSuites =
          response.data?.createdSuites?.reduce(
            (sum, item) => sum + item.created,
            0,
          ) ?? 0;
        if (activatedFrameworks > 0) {
          toast.success(
            `Activated ${activatedFrameworks} framework${activatedFrameworks === 1 ? '' : 's'} during setup.`,
          );
        }
        if (createdSuites > 0) {
          toast.success(
            `Created ${createdSuites} starter test${createdSuites === 1 ? '' : 's'} during setup.`,
          );
        }

        // Navigate to home page after successful setup
        navigate('/');
      } else {
        toast.error(response.error || 'Setup failed');
      }
    } catch (error: unknown) {
      const msg = error instanceof ApiError ? error.message : 'An error occurred during setup';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordStrengthIndicator = ({ password }: { password: string }) => {
    if (!password) return null;

    const requirements = [
      { label: '8+ characters', met: password.length >= 8 },
      { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
      { label: 'Lowercase letter', met: /[a-z]/.test(password) },
      { label: 'Number', met: /[0-9]/.test(password) },
      { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
    ];

    const metCount = requirements.filter((req) => req.met).length;
    const strengthColor =
      metCount <= 2
        ? 'text-red-600'
        : metCount <= 4
          ? 'text-yellow-600'
          : 'text-green-600';

    return (
      <div className="mt-2 space-y-1">
        <div className={`text-xs font-medium ${strengthColor}`}>
          Password strength:{' '}
          {metCount <= 2 ? 'Weak' : metCount <= 4 ? 'Medium' : 'Strong'}
        </div>
        <div className="grid grid-cols-1 gap-1">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${req.met ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              <span
                className={`text-xs ${req.met ? 'text-green-700' : 'text-gray-500'}`}
              >
                {req.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
              <Settings className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">System Setup</h1>
          <p className="text-gray-600 mt-2">
            Initialize your ISMS platform with organization and admin accounts
          </p>
        </div>

        <Card className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Organization Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Organization Information
                </h3>

                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your organization name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Super Admin Information */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  System Administrator (Super Admin)
                </h3>
                <p className="text-sm text-gray-600">
                  This user will have system-wide access
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="adminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter admin name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter admin email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="adminPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showAdminPassword ? 'text' : 'password'}
                            placeholder="Create a strong password"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            onClick={() =>
                              setShowAdminPassword(!showAdminPassword)
                            }
                          >
                            {showAdminPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <PasswordStrengthIndicator password={field.value} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Organization Admin Information */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Organization Administrator
                </h3>
                <p className="text-sm text-gray-600">
                  This user will have organization-wide access
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="orgAdminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Admin Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter organization admin name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="orgAdminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Admin Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter organization admin email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="orgAdminPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Admin Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showOrgAdminPassword ? 'text' : 'password'}
                            placeholder="Create a strong password"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            onClick={() =>
                              setShowOrgAdminPassword(!showOrgAdminPassword)
                            }
                          >
                            {showOrgAdminPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <PasswordStrengthIndicator password={field.value} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Framework Setup
                </h3>
                <p className="text-sm text-gray-600">
                  Choose which framework-aligned suites should be created
                  immediately after setup.
                </p>

                <FormField
                  control={form.control}
                  name="selectedFrameworks"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {FRAMEWORK_SUITE_OPTIONS.map((option) => {
                            const selectedValues = field.value ?? [];
                            const checked = selectedValues.includes(option.id);
                            return (
                              <label
                                key={option.id}
                                className={`flex gap-3 rounded-xl border p-4 transition-colors cursor-pointer ${checked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(value) => {
                                    const next = value
                                      ? [...selectedValues, option.id]
                                      : selectedValues.filter(
                                          (item) => item !== option.id,
                                        );
                                    field.onChange(next);
                                  }}
                                  className="mt-0.5"
                                />
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                                    {option.framework}
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-gray-900">
                                    {option.name}
                                  </p>
                                  <p className="mt-1 text-xs leading-5 text-gray-600">
                                    {option.description}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Setting up system...' : 'Setup System'}
              </Button>

              <div className="text-center text-sm text-gray-500">
                <p>
                  Note: Setup can only be performed once. Controls and policies
                  seeded will reflect the frameworks selected above.
                </p>
              </div>
            </form>
          </Form>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2024 Manzen Security Platform. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
