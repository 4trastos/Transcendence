export interface Message {
    sender_id: string,
    content: {
        text: string;
    };
    chatId: string;
    created_at?: Date;
    
    //created_at: Date;
}


export const messageDtoSchema = {
    type: "object",
    properties: {
        sender_id: { type: "string" },
        content: { type: "object", properties: { text: { type: "string" } } },
        chatId: { type: "string" },
    },
    required: ["sender_id", "content", "chatId"],
    additionalProperties: false,
};
export const messageDtoSchemaArray = {
    type: "array",
    items: messageDtoSchema,
};
export const messageDtoSchemaArrayResponse = {
    type: "object",
    properties: {
        messages: messageDtoSchemaArray,
    },
    required: ["messages"],
};