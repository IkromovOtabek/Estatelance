import { gql } from '@apollo/client';

export const AI_ASSIST = gql`
  mutation AiAssist($action: String!, $context: String!) {
    aiAssist(action: $action, context: $context)
  }
`;
