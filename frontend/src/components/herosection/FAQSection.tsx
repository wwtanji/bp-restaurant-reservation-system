import React, { useState, useRef } from 'react';

const FAQ_ITEMS = [
  {
    question: 'Why should I use Reservelt to find restaurants?',
    answer:
      'Reservelt helps you discover restaurants across Slovakia for every occasion. Browse by cuisine, location, and availability to find the perfect table — all confirmed instantly.',
  },
  {
    question: 'Can I read or leave a restaurant review on Reservelt?',
    answer:
      'Yes! After dining at a restaurant you booked through Reservelt, you can leave a review to share your experience and help other diners make informed decisions.',
  },
  {
    question: 'How do I make a reservation?',
    answer:
      'Simply search for a restaurant, select your date, time, and party size, then confirm your booking. You will receive an instant confirmation with all the details.',
  },
  {
    question: 'Can I cancel or modify my reservation?',
    answer:
      'You can manage your reservations from the "My Reservations" page. Cancel or modify your booking at any time before your scheduled dining time.',
  },
];

const FAQItem: React.FC<{
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ question, answer, isOpen, onToggle }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="border-b border-ot-iron dark:border-dark-border">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="text-sm font-bold text-ot-charade dark:text-dark-text pr-4">
          {question}
        </span>
        <svg
          className={`w-5 h-5 text-ot-manatee dark:text-dark-text-secondary flex-shrink-0 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? (contentRef.current?.scrollHeight ?? 200) : 0,
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef}>
          <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary leading-relaxed pb-5">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
};

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const leftColumn = FAQ_ITEMS.filter((_, i) => i % 2 === 0);
  const rightColumn = FAQ_ITEMS.filter((_, i) => i % 2 !== 0);

  return (
    <div className="bg-white dark:bg-dark-paper py-12 border-t border-ot-iron dark:border-dark-border">
      <div className="max-w-ot mx-auto px-4">
        <h2 className="text-2xl font-bold text-ot-charade dark:text-dark-text mb-8">
          Frequently asked questions about Reservelt
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
          <div>
            {leftColumn.map((item, i) => {
              const realIndex = i * 2;
              return (
                <FAQItem
                  key={realIndex}
                  question={item.question}
                  answer={item.answer}
                  isOpen={openIndex === realIndex}
                  onToggle={() => toggle(realIndex)}
                />
              );
            })}
          </div>
          <div>
            {rightColumn.map((item, i) => {
              const realIndex = i * 2 + 1;
              return (
                <FAQItem
                  key={realIndex}
                  question={item.question}
                  answer={item.answer}
                  isOpen={openIndex === realIndex}
                  onToggle={() => toggle(realIndex)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQSection;
