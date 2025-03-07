'use server';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

  const FormSchema = z.object({
    id: z.string({invalid_type_error: "Please select a customer!"}),
    customerId: z.string(),
    amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {invalid_type_error: 'Please select an invoice status.'}),
    date: z.string(),
  });

  const CustomerFormSchema = z.object({
    email: z
        .string()
        .min(1, { message: "This field is required." })
        .email("This is not a valid email.")
        .refine(async (e) => {return await checkIfEmailIsValid(e);}, "There was an error with this email address"),
    name: z.string().min(1, {message: "This field is required."})
  });
   
  const CreateInvoice = FormSchema.omit({ id: true, date: true });
  const CreateCustomer = CustomerFormSchema.omit({});
  const invoicesRedirect = '/dashboard/invoices';
  const customersRedirect = '/dashboard/customers';
  export type State = {
    errors?: {
      customerId?: string[];
      amount?: string[];
      status?: string[];
      name?: string[];
      email?: string[];
    };
    message?: string | null;
  };

  export async function createCustomer(prevState: State, formData: FormData) {
    // Validate form using Zod
    const validatedFields = await CreateCustomer.safeParseAsync({
      name: formData.get('name'),
      email: formData.get('email')
    });
   
    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Create Customer.',
      };
    }
   
    // Prepare data for insertion into the database
    const { name, email } = validatedFields.data;

    // Insert data into the database
    try {
      await sql`INSERT INTO customers (name, email, image_url) VALUES (${name}, ${email}, '/customers/default-pfp.png')`;
    } catch (error) {
      // If a database error occurs, return a more specific error.
      console.log(error);
      return {
        message: 'Database Error: Failed to Create Customer.',
      };
    }
   
    // Revalidate the cache for the Customer page and redirect the user.
    revalidatePath(customersRedirect.toString());
    redirect(customersRedirect.toString());
    return {message: "Successfully Created!"}
  }



  export async function createInvoice(prevState: State, formData: FormData) {
    // Validate form using Zod
    const validatedFields = CreateInvoice.safeParse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
   
    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Create Invoice.',
      };
    }
   
    // Prepare data for insertion into the database
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
   
    // Insert data into the database
    try {
      await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      `;
    } catch (error) {
      // If a database error occurs, return a more specific error.
      console.log(error);
      return {
        message: 'Database Error: Failed to Create Invoice.',
      };
    }
   
    // Revalidate the cache for the invoices page and redirect the user.
    Reload();
    return {message: "Successfully Created!"}
  }

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
 
export async function updateInvoice(
    id: string,
    prevState: State,
    formData: FormData,
  ) {
    const validatedFields = UpdateInvoice.safeParse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
   
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Update Invoice.',
      };
    }
   
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
   
    try {
      await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
    } catch (error) {
      console.log(error);
      return { message: 'Database Error: Failed to Update Invoice.' };
    }
   
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }
 
export async function deleteInvoice(id: string) {
    try {
        await sql`
        DELETE FROM invoices
        WHERE id = ${id}
      `;
     
      revalidatePath(invoicesRedirect.toString());
    } 
    catch (error) {
      console.log(error);
      return { message: 'Database Error: Failed to Delete Invoice' };
    }
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    console.log(error);

    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

async function checkIfEmailIsValid(email: string){
    try {
      const value = await sql`
      SELECT Email FROM Customers
      WHERE email = ${email}
      LIMIT 1
    `;

    return value.rowCount === 0 ? true : false ;
  } 
  catch (error) {
    console.log(error);
    return { message: 'Database Error: Failed to check emails' };
  }
}

function Reload(){
    revalidatePath(invoicesRedirect.toString());
    redirect(invoicesRedirect.toString());
}