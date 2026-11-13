export interface PublicationNotifier {
  execute(input: { projectId: string }): Promise<unknown>
}
