export interface QAPair {
  questions: string[];
  answer: string;
}
export interface QAPairs {
  pairs: QAPair[];
}

export const QAPairsSchema = {
  $defs: {
    QAPair: {
      properties: {
        questions: {
          description:
            "List of questions, all with the same meaning but worded differently",
          items: { type: "string" },
          title: "Questions",
          type: "array",
        },
        answer: { description: "Answer", title: "Answer", type: "string" },
      },
      required: ["questions", "answer"],
      title: "QAPair",
      type: "object",
    },
  },
  properties: {
    pairs: {
      description: "List of question/answer pairs",
      items: { $ref: "#/$defs/QAPair" },
      title: "Pairs",
      type: "array",
    },
  },
  required: ["pairs"],
  title: "QAPairs",
  type: "object",
};

export interface MarkdownSection {
  docId: number;
  sectionId: number;
  markdown: string;
}

export interface QAData {
  input: string;
  expected?: string;
  metadata?: {
    document_id: number;
    section_id: number;
    topic_idx: number;
    question_idx: number;
    id: number;
    split: string;
  };
}
