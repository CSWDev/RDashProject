import { fetchCustomersPages, fetchFilteredCustomers } from '@/app/lib/data';
import { CreateCustomer } from '@/app/ui/customers/buttons';
import Table from '@/app/ui/customers/table';
import { lusitana } from '@/app/ui/fonts';
import Pagination from '@/app/ui/invoices/pagination';
import Search from '@/app/ui/search';

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;}) {
    const searchParams = await props.searchParams;
    const query = searchParams?.query || '';
    const currentPage = Number(searchParams?.page) || 1;
    const customers = await fetchFilteredCustomers(query, currentPage);
    const totalPages = await fetchCustomersPages(query);
    console.log(totalPages);
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Customers</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search customers..." />
        <CreateCustomer />
      </div>
        <Table customers={customers} currentPage={currentPage}/>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}