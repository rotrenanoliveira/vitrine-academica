import type { CallApplicationWithApplicant } from '@/domain/call/application/dtos/call-application-with-applicant'
import type { CallApplicationWithCall } from '@/domain/call/application/dtos/call-application-with-call'
import type { CallApplication } from '@/domain/call/enterprise/entities/call-application'

export class CallApplicationPresenter {
  static toHTTP(application: CallApplication) {
    return {
      id: application.id.toString(),
      callId: application.callId.toString(),
      applicantId: application.applicantId.toString(),
      message: application.message,
      status: application.status,
      decidedAt: application.decidedAt?.toISOString() ?? null,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt?.toISOString() ?? null,
    }
  }

  static toHTTPWithApplicant({ application, applicant }: CallApplicationWithApplicant) {
    return {
      ...CallApplicationPresenter.toHTTP(application),
      applicant: {
        id: applicant.id,
        name: applicant.name,
        memberships: applicant.memberships.map((membership) => ({
          institutionId: membership.institutionId,
          institutionName: membership.institutionName,
          role: membership.role,
        })),
      },
    }
  }

  static toHTTPWithCall({ application, call }: CallApplicationWithCall) {
    return {
      ...CallApplicationPresenter.toHTTP(application),
      call: {
        id: call.id.toString(),
        title: call.title,
        status: call.status,
        applicationDeadline: call.applicationDeadline.toISOString(),
      },
    }
  }
}
