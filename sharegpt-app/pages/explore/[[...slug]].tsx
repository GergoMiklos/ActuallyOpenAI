import ConvoCard from "@/components/explore/convo-card";
import ExploreLayout from "@/components/explore/layout";
import { getConvos } from "@/lib/api";
import prisma from "@/lib/prisma";
import { ConversationMeta } from "@/lib/types";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { PAGINATION_LIMIT } from "@/lib/constants";
import Pagination from "@/components/explore/pagination";

export default function Explore({
  type,
  totalConvos,
  convos,
}: {
  type: "new" | "top";
  totalConvos: number;
  convos: ConversationMeta[];
}) {
  const router = useRouter();
  const { page } = router.query as { page?: string };
  const { data: convosData } = useSWR<ConversationMeta[]>(
    `/api/conversations?type=${type}${page ? `&page=${page}` : ""}`,
    fetcher,
    {
      fallbackData: convos,
      keepPreviousData: true,
    }
  );

  return (
    <ExploreLayout type={type} totalConvos={totalConvos}>
      <div className="pb-20 px-2 sm:max-w-screen-lg w-full mx-auto">
        <motion.ul
          key={router.asPath} // need key or else inter page transitions won't work
          initial="hidden"
          whileInView="show"
          animate="show"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
          className="mt-8 grid gap-2"
        >
          {convosData?.slice(0, 10).map((convo) => (
            <ConvoCard key={convo.id} data={convo} />
          ))}
        </motion.ul>
        <ul className="mt-2 grid gap-2">
          {convosData?.slice(10).map((convo) => (
            <ConvoCard key={convo.id} data={convo} />
          ))}
        </ul>
        <Pagination count={totalConvos} />
      </div>
    </ExploreLayout>
  );
}

export async function getStaticPaths() {
  return {
    paths: [
      {
        params: {
          slug: [],
        },
      },
      {
        params: {
          slug: ["new"],
        },
      },
    ],
    fallback: false,
  };
}

export async function getStaticProps({
  params,
}: {
  params: { slug: string[] };
}) {
  const { slug } = params;
  const type = slug && slug[0] === "new" ? "new" : "top";

  const totalConvos = await prisma.conversation.count();
  const convos = await getConvos({
    orderBy: type === "new" ? "createdAt" : "views",
    take: PAGINATION_LIMIT,
  });

  return {
    props: {
      type,
      totalConvos,
      convos,
    },
    revalidate: 60,
  };
}
