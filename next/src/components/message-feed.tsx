import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Message, Topic } from '@/lib/types'

const MESSAGES: Message[] = [
  {
    id: '2',
    content:
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Impedit, quae esse. Accusamus modi, animi aliquam at voluptatibus possimus, voluptatum quasi excepturi blanditiis suscipit facilis. Itaque maiores aperiam corporis ut possimus.',
    createdAt: new Date(),
    author: {
      id: '1',
      name: 'User 2',
      image: null,
    },
  },
  {
    id: '1',
    content: 'Hello world!',
    createdAt: new Date(Date.now() - 1000),
    author: {
      id: '2',
      name: 'User',
      image: null,
    },
  },
]

export async function MessageFeed({ topic }: { topic: Topic }) {
  const messages = MESSAGES

  return (
    <div className="flex-col-reverse items-start space-y-4 overflow-y-scroll">
      {messages.length === 0 && (
        <p className="text-gray-500">This is the beginning of #{topic.title}</p>
      )}
      {messages.map((message) => (
        <div key={message.id} className="flex">
          <Avatar>
            <AvatarImage src={message.author.image ?? undefined} />
            <AvatarFallback>
              {message.author.name
                .split(' ')
                .map((part) => part[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <div className="text-sm">
              <span className="font-bold">{message.author.name}</span>
              <span className="ml-2 text-gray-400 font-light">
                {new Date(message.createdAt).toLocaleString()}
              </span>
            </div>
            <p>{message.content}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
